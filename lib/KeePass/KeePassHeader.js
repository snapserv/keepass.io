'use strict';
var dejavu = require('dejavu');
var Errors = require('../Utility/Errors');

var KeePassHeader = dejavu.Class.declare({
	$name: 'KeePassHeader',

	__fields: {},
	__formats: {},
	__data: {},

	initialize: function() {
		this.declare({
			fields: {
				'EndOfHeader': 0,
				'Comment': 1,
				'CipherID': 2,
				'CompressionFlags': 3,
				'MasterSeed': 4,
				'TransformSeed': 5,
				'TransformRounds': 6,
				'EncryptionIV': 7,
				'ProtectedStreamKey': 8,
				'StreamStartBytes': 9,
				'InnerRandomStreamID': 10
			},
			formats: {
				3: 'INTEGER',
				6: 'QUAD'
			}
		})
	},

	get: function(identifier) {
		var fieldID = this.resolveField(identifier);
		if(this.__formats.hasOwnProperty(fieldID)) {
			if(this.__formats[fieldID] === 'INTEGER') {
				return this.__data[fieldID].readUInt32LE(0);
			} else if(this.__formats[fieldID] === 'QUAD') {
				return this.__data[fieldID].readUInt32LE(4) * ((1 << 16) * (1 << 16)) + this.__data[fieldID].readUInt32LE(0);
			} else {
				throw new Error('Unknown header field format specified: ' + this.__formats[fieldID]);
			}
		} else {
			return this.getRaw(identifier);
		}
	},

	getRaw: function(identifier) {
		return this.__data[this.resolveField(identifier)];
	},

	set: function(identifier, value) {
		this.__data[this.resolveField(identifier)] = value;
	},

	declare: function(options) {
		if(typeof options !== 'object') throw new Errors.Argument('Expected `options` to be an Object');
		if(options.hasOwnProperty('fields')) this.__fields = options.fields;
		if(options.hasOwnProperty('formats')) this.__formats = options.formats;

		for(var key in options.fields) {
			this.__data[this.__fields[key]] = undefined;
		}
	},

	buildHeader: function(headerLength) {
		var headerBuffer = new Buffer(headerLength);
		var currentOffset = 0;

		// Add all headers except 'EndOfHeader'
		for(var key in this.__fields) {
			var fieldID = this.__fields[key];
			if(this.__data[this.__fields[key]] !== undefined) {
				if(this.__fields[key] !== 0) {
					var fieldData = this.__data[fieldID];
					var fieldLength = fieldData.length;

					headerBuffer.writeUInt8(fieldID, currentOffset); currentOffset += 1;
					headerBuffer.writeUInt16LE(fieldLength, currentOffset); currentOffset += 2;
					headerBuffer.write(fieldData.toString('hex'), currentOffset, fieldLength, 'hex'); currentOffset += fieldLength;
				}
			}
		}

		// Last but not least, add 'EndOfHeader' to the header chain
		headerBuffer.writeUInt8(0, currentOffset); currentOffset += 1;
		headerBuffer.writeUInt16LE(4, currentOffset); currentOffset += 2;
		headerBuffer.write('0d0a0d0a', currentOffset, 4, 'hex'); currentOffset += 4;

		return headerBuffer;
	},

	hasField: function(identifier) {
		return (this.__data.hasOwnProperty(identifier) || this.__fields.hasOwnProperty(identifier));
	},

	resolveField: function(identifier) {
		if(this.__data.hasOwnProperty(identifier)) return identifier;
		if(this.__fields.hasOwnProperty(identifier)) return this.__fields[identifier];
		throw new Error('Could not resolve header field with identifier: ' + identifier);
	}
});

module.exports = KeePassHeader;