'use strict';
var dejavu = require('dejavu');
var async = require('async');
var assert = require('chai').assert;
var jspack = require('jspack').jspack;
var crypto = require('crypto');
var KeePassHeader = require('./KeePassHeader');
var Cryptography = require('../Utility/Cryptography');

var KeePassDatabase = dejavu.Class.declare({
	$name: 'KeePassDatabase',
	$constants: {
		BASE_SIGNATURE: 0x9AA2D903,
		VERSION_SIGNATURE: 0xB54BFB67
	},

	_header: null,
	_headerLength: null,
	__masterKey: null,

	initialize: function() {
		this._header = new KeePassHeader();
	},

	load: function(fileContents, credentialStore, callback) {
		assert.instanceOf(fileContents, Buffer, 'Expected `fileContents` to be a Buffer');
		async.waterfall([
			////////////////////////////
			// Check database signatures
			////////////////////////////
			function checkSignatures(callback) {
				var baseSignature = jspack.Unpack('<I', fileContents.slice(0, 4), 0)[0];
				var versionSignature = jspack.Unpack('<I', fileContents.slice(4, 8), 0)[0];

				if(baseSignature != this.$static.BASE_SIGNATURE) {
					return callback(new Error('Database base signature does not match. File might be corrupt.'));
				}
				if(versionSignature != this.$static.VERSION_SIGNATURE) {
					return callback(new Error('Sorry, your database version is not supported by this library.'));
				}

				return callback(null);
			}.$bind(this),

			////////////////////////
			// Parse database header
			////////////////////////
			function parseDatabaseHeader(callback) {
				var currentOffset = 12;

				while(true) {
					// Get field ID of header
					var fieldID = jspack.Unpack('<b', fileContents.slice(currentOffset, currentOffset + 1))[0];
					currentOffset += 1;

					// Check if field ID is valid
					if(!this._header.hasField(fieldID)) {
						return callback(new Error('Invalid header field ID. The database might be corrupt.'));
					}

					// Get header field length
					var fieldLength = jspack.Unpack('<h', fileContents.slice(currentOffset, currentOffset + 2))[0];
					currentOffset += 2;

					// If field length is greater than zero, read it
					if(fieldLength > 0) {
						var fieldData = fileContents.slice(currentOffset, currentOffset + fieldLength);
						fieldData = jspack.Unpack('<' + fieldLength + 'A', fieldData)[0];
						currentOffset += fieldLength;
						this._header.set(fieldID, fieldData);
					} else if(fieldLength < 0) {
						return callback(new Error('Found negative header field length. The database might be corrupt.'));
					}

					// Abort if field ID is zero, which represents the 'EndOfHeader' field
					if(fieldID === 0) {
						this._headerLength = currentOffset;
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
				var database = fileContents.slice(this._headerLength).toString('binary');

				// Decrypt database with AES-256-CBC
				cipher.setAutoPadding(true);
				try {
					database = cipher.update(database, 'binary', 'binary') + cipher.final('binary');
				} catch(err) {
					return callback(new Error('Could not decrypt database. Either the credentials were invalid or the database is corrupt.'));
				}

				return callback(null);
			}.$bind(this)
		], function(err) {
			callback(err);
		});
	}
});

module.exports = KeePassDatabase;