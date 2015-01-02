'use strict';
var dejavu = require('dejavu');
var async = require('async');
var xml2js = require('xml2js');
var crypto = require('crypto');
var zlib = require('zlib');
var KeePassHeader = require('./KeePassHeader');
var RawApi = require('./APIs/RawApi');
var BasicApi = require('./APIs/BasicApi');
var Errors = require('../Utility/Errors');
var CredentialStore = require('../Utility/CredentialStore');
var Cryptography = require('../Utility/Cryptography');
var HashedBlockIO = require('../Utility/HashedBlockIO');
var SalsaManager = require('../Utility/SalsaManager');

var KeePassDatabase = dejavu.Class.declare({
	$name: 'KeePassDatabase',
	$constants: {
		BASE_SIGNATURE: 0x9AA2D903,
		VERSION_SIGNATURE: 0xB54BFB67
	},
	$statics: {
		SALSA_IV: [0xE8, 0x30, 0x09, 0x4B, 0x97, 0x20, 0x5D, 0x2A]
	},

	_rawApi: null,
	_basicApi: null,

	_header: null,
	_headerLength: null,
	_payloadOffset: null,
	_fileVersion: null,
	__masterKey: null,
	__container: null,

	initialize: function() {
		this._header = new KeePassHeader();
		this._rawApi = new RawApi();
		this._basicApi = new BasicApi();
	},

	load: function(fileContents, credentialStore, callback) {
		if(!(fileContents instanceof Buffer)) throw new Errors.Argument('Expected `fileContents` to be a Buffer');
		if(typeof callback !== 'function') throw new Errors.Argument('Expected `callback` to be a Function');
		if(!dejavu.instanceOf(credentialStore, CredentialStore)) {
			throw new Errors.Argument('Expected `credentialStore` to be a CredentialStore');
		}

		async.waterfall([
			////////////////////////////
			// Check database signatures
			////////////////////////////
			function checkSignatures(callback) {
				var baseSignature = fileContents.readUInt32LE(0);
				var versionSignature = fileContents.readUInt32LE(4);
				var fileVersion = fileContents.readUInt32LE(8);

				if(baseSignature != this.$static.BASE_SIGNATURE) {
					return callback(new Errors.Database('Database base signature does not match. File might be corrupt.'));
				}
				if(versionSignature != this.$static.VERSION_SIGNATURE) {
					return callback(new Errors.Database('Sorry, your database version is not supported by this library.'));
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
						return callback(new Errors.Database('Invalid header field ID. The database might be corrupt.'));
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
						return callback(new Errors.Database('Found negative header field length. The database might be corrupt.'));
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
					return callback(new Errors.Database('Could not decrypt database. Either the credentials were invalid or the database is corrupt.'));
				}

				// Check database consistency with HBIO
				var headerStartBytes = this._header.get('StreamStartBytes').toString('binary');
				var streamStartBytes = database.slice(0, headerStartBytes.length);
				if(headerStartBytes != streamStartBytes) {
					try {
						database = HashedBlockIO.decrypt(database.slice(headerStartBytes.length));
					} catch(err) {
						return callback(new Errors.Database('Database integrity check failed: ' + err.toString()));
					}
				} else {
					return callback(new Errors.Database('Stream start bytes were invalid. Either the credentials were invalid or the database is corrupt.'));
				}

				return callback(null, database);
			}.$bind(this),

			//////////////////////
			// Decompress database
			//////////////////////
			function decompressDatabase(database, callback) {
				if(this._header.get('CompressionFlags') === 1) {
					zlib.gunzip(database, function(err, database) {
						if(err) return callback(new Errors.Database('Could not decompress database: ' + err.toString()));
						return callback(null, database);
					}.$bind(this));
				} else {
					return callback(null, database);
				}
			}.$bind(this),

			////////////////////////
			// Parse database as XML
			////////////////////////
			function parseAsXml(database, callback) {
				database = xml2js.parseString(database, {explicitArray: false}, function(err, database) {
					if(err) return callback(new Errors.Database('Could not parse database as XML: ' + err.toString()));
					return callback(null, database);
				});
			}.$bind(this),

			///////////////////////////
			// Unlock protected entries
			///////////////////////////
			function unlockProtectedEntries(database, callback) {
				function searchProtectedEntries(object, parentObject, foundFn) {
					for(var key in object) {
						if(key === 'Protected') {
							foundFn(parentObject);
						} else if(typeof object[key] === 'object') {
							searchProtectedEntries(object[key], object, foundFn);
						}
					}
				}

				// Initialize the SalsaManager
				var salsaKey = this._header.get('ProtectedStreamKey');
				salsaKey = crypto.createHash('sha256').update(salsaKey).digest('binary');
				salsaKey = new Buffer(salsaKey, 'binary');
				var salsaManager = new SalsaManager(salsaKey, this.$static.SALSA_IV);

				// Unlock all protected entries recursively
				searchProtectedEntries(database, null, function(object) {
					if(object['$']['Protected'] == 'True' && object['_']) {
						var unlockedValue = new Buffer(object['_'], 'base64').toString('binary');
						unlockedValue = salsaManager.unpack(unlockedValue);	
						object['_'] = unlockedValue;
					}
				});
				return callback(null, database);
			}.$bind(this),

			///////////////////////
			// Pass database to API
			///////////////////////
			function passToApi(database, callback) {
				this.__container = { db: database, dirty: 0 };
				this._rawApi.$passDatabase(this.__container);
				this._basicApi.$passDatabase(this.__container);
				return callback(null);
			}.$bind(this)
		], callback);
	},

	save: function(credentialStore, callback) {
		if(typeof callback !== 'function') throw new Errors.Argument('Expected `callback` to be a Function');
		if(!dejavu.instanceOf(credentialStore, CredentialStore)) {
			throw new Errors.Argument('Expected `credentialStore` to be a CredentialStore');
		}

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

			//////////////////////////
			// Fetch database from API
			//////////////////////////
			function fetchFromApi(callback) {
				var database = this.__container.db;
				return callback(null, database);
			}.$bind(this),

			/////////////////////////
			// Lock protected entries
			/////////////////////////
			function lockProtectedEntries(database, callback) {
				function searchProtectedEntries(object, parentObject, foundFn) {
					for(var key in object) {
						if(key === 'Protected') {
							foundFn(parentObject);
						} else if(typeof object[key] === 'object') {
							searchProtectedEntries(object[key], object, foundFn);
						}
					}
				}

				// Initialize the SalsaManager
				var salsaKey = this._header.get('ProtectedStreamKey');
				salsaKey = crypto.createHash('sha256').update(salsaKey).digest('binary');
				salsaKey = new Buffer(salsaKey, 'binary');
				var salsaManager = new SalsaManager(salsaKey, this.$static.SALSA_IV);

				// Lock all protected entries recursively
				searchProtectedEntries(database, null, function(object) {
					if(object['$']['Protected'] == 'True' && object['_']) {
						var lockedValue = salsaManager.unpack(object['_']);
						lockedValue = new Buffer(lockedValue, 'binary').toString('base64');
						object['_'] = lockedValue;
					}
				});
				return callback(null, database);
			}.$bind(this),

			/////////////////////////////
			// Convert JSON object to XML
			/////////////////////////////
			function convertToXml(database, callback) {
				var builder = new xml2js.Builder();
				database = builder.buildObject(database);
				return callback(null, database);
			}.$bind(this),

			////////////////////
			// Compress database
			////////////////////
			function compressDatabase(database, callback) {
				if(this._header.get('CompressionFlags') === 1) {
					zlib.gzip(database, function(err, database) {
						if(err) return callback(new Errors.Generic('Could not compress database: ' + err.toString()));
						return callback(null, database);
					});
				} else {
					return callback(null, database);
				}
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
				database = Buffer.concat([
					new Buffer(cipher.update(database, 'binary'), 'binary'),
					new Buffer(cipher.final('binary'), 'binary')
				]);

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
	},

	getRawApi: function() {
		return this._rawApi;
	},

	getBasicApi: function() {
		return this._basicApi;
	}
});

module.exports = KeePassDatabase;