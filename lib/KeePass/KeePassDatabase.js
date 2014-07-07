'use strict';
var dejavu = require('dejavu');
var async = require('async');
var assert = require('chai').assert;
var crypto = require('crypto');
var zlib = require('zlib');
var KeePassHeader = require('./KeePassHeader');
var Cryptography = require('../Utility/Cryptography');
var HashedBlockIO = require('../Utility/HashedBlockIO');

var KeePassDatabase = dejavu.Class.declare({
	$name: 'KeePassDatabase',
	$constants: {
		BASE_SIGNATURE: 0x9AA2D903,
		VERSION_SIGNATURE: 0xB54BFB67
	},

	_fileVersion: null,
	_header: null,
	_headerLength: null,
	_payloadOffset: null,
	__masterKey: null,
	__database: null,

	initialize: function() {
		this._header = new KeePassHeader();
	},

	load: function(fileContents, credentialStore, callback) {
		assert.instanceOf(fileContents, Buffer, 'Expected `fileContents` to be a Buffer');
		assert.isFunction(callback, 'Expected `callback` to be a Function');

		async.waterfall([
			////////////////////////////
			// Check database signatures
			////////////////////////////
			function checkSignatures(callback) {
				var baseSignature = fileContents.readUInt32LE(0);
				var versionSignature = fileContents.readUInt32LE(4);
				var fileVersion = fileContents.readUInt32LE(8);

				if(baseSignature != this.$static.BASE_SIGNATURE) {
					return callback(new Error('Database base signature does not match. File might be corrupt.'));
				}
				if(versionSignature != this.$static.VERSION_SIGNATURE) {
					return callback(new Error('Sorry, your database version is not supported by this library.'));
				}
				this._fileVersion = fileVersion;

				return callback(null);
			}.$bind(this),

			////////////////////////
			// Parse database header
			////////////////////////
			function parseDatabaseHeader(callback) {
				var currentOffset = 12;

				while(true) {
					// Get field ID of header
					var fieldID = fileContents.readUInt8(currentOffset);
					currentOffset += 1;

					// Check if field ID is valid
					if(!this._header.hasField(fieldID)) {
						return callback(new Error('Invalid header field ID. The database might be corrupt.'));
					}

					// Get header field length
					var fieldLength = fileContents.readUInt16LE(currentOffset);
					currentOffset += 2;

					// If field length is greater than zero, read it
					if(fieldLength > 0) {
						var fieldData = fileContents.slice(currentOffset, currentOffset + fieldLength);
						currentOffset += fieldLength;
						this._header.set(fieldID, fieldData);
					} else if(fieldLength < 0) {
						return callback(new Error('Found negative header field length. The database might be corrupt.'));
					}

					// Abort if field ID is zero, which represents the 'EndOfHeader' field
					if(fieldID === 0) {
						this._headerLength = currentOffset - 12;
						this._payloadOffset = currentOffset;
						break;
					}
				}

				return callback(null);
			}.$bind(this),

			///////////////////
			// Build master key
			///////////////////
			function buildMasterKey(callback) {
				this.__masterKey = Cryptography.buildMasterKey(
					credentialStore.buildCompositeHash().toString('binary'),
					this._header.get('MasterSeed').toString('binary'),
					this._header.get('TransformSeed').toString('binary'),
					this._header.get('TransformRounds')
				);

				return callback(null);
			}.$bind(this),

			///////////////////
			// Decrypt database
			///////////////////
			function decryptDatabase(callback) {
				var cipher = crypto.createDecipheriv('aes-256-cbc', this.__masterKey, this._header.get('EncryptionIV'));
				var database = fileContents.slice(this._payloadOffset).toString('binary');

				// Decrypt database with AES-256-CBC
				cipher.setAutoPadding(true);
				try {
					database = cipher.update(database, 'binary', 'binary') + cipher.final('binary');
					database = new Buffer(database, 'binary');
				} catch(err) {
					return callback(new Error('Could not decrypt database. Either the credentials were invalid or the database is corrupt.'));
				}

				// Check database consistency with HBIO
				var headerStartBytes = this._header.get('StreamStartBytes').toString('binary');
				var streamStartBytes = database.slice(0, headerStartBytes.length);
				if(headerStartBytes != streamStartBytes) {
					try {
						database = HashedBlockIO.decrypt(database.slice(headerStartBytes.length));
					} catch(err) {
						return callback(new Error('Database integrity check failed: ' + err.toString()));
					}
				} else {
					return callback(new Error('Stream start bytes were invalid. Either the credentials were invalid or the database is corrupt.'));
				}

				return callback(null, database);
			}.$bind(this),

			//////////////////////
			// Decompress database
			//////////////////////
			function decompressDatabase(database, callback) {
				if(this._header.get('CompressionFlags') === 1) {
					zlib.gunzip(database, function(err, database) {
						if(err) return cb(new Error('Could not decompress database: ' + err.toString()));
						this.__database = database;
						return callback(null);
					}.$bind(this));
				}
			}.$bind(this)
		], callback);
	},

	save: function(credentialStore, callback) {
		assert.isFunction(callback, 'Expected `callback` to be a Function');

		async.waterfall([
			///////////////////
			// Build master key
			///////////////////
			function buildMasterKey(callback) {
				this.__masterKey = Cryptography.buildMasterKey(
					credentialStore.buildCompositeHash().toString('binary'),
					this._header.get('MasterSeed').toString('binary'),
					this._header.get('TransformSeed').toString('binary'),
					this._header.get('TransformRounds')
				);

				return callback(null);
			}.$bind(this),

			////////////////////
			// Compress database
			////////////////////
			function compressDatabase(callback) {
				zlib.gzip(this.__database, function(err, database) {
					if(err) return cb(new Error('Could not compress database: ' + err.toString()));
					return callback(null, database);
				})
			}.$bind(this),

			///////////////////
			// Encrypt database
			///////////////////
			function encryptDatabase(database, callback) {
				// Split database into HBIO blocks and concat it with StreamStartbytes
				database = HashedBlockIO.encrypt(database);
				database = Buffer.concat([this._header.get('StreamStartBytes'), database]);
				
				// Encrypt database with AES-256-CBC
				var cipher = crypto.createCipheriv('aes-256-cbc', this.__masterKey, this._header.get('EncryptionIV'));
				database = Buffer.concat([cipher.update(database), cipher.final()]);

				return callback(null, database);
			}.$bind(this),

			////////////////////////
			// Build database header
			////////////////////////
			function buildHeader(database, callback) {
				var header = this._header.buildHeader(this._headerLength);
				return callback(null, header, database);
			}.$bind(this),

			////////////////////////////
			// Build database signatures
			////////////////////////////
			function buildSignatures(header, database, callback) {
				var signatures = new Buffer(12);
				signatures.writeUInt32LE(this.$static.BASE_SIGNATURE, 0);
				signatures.writeUInt32LE(this.$static.VERSION_SIGNATURE, 4);
				signatures.writeUInt32LE(this._fileVersion, 8);

				return callback(null, signatures, header, database);
			}.$bind(this),

			//////////////////////////
			// Merge sections together
			//////////////////////////
			function mergeSectionsTogether(signatures, header, database, callback) {
				return callback(null, Buffer.concat([signatures, header, database]));
			}
		], callback)
	}
});

module.exports = KeePassDatabase;