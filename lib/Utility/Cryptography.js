'use strict';
var dejavu = require('dejavu');
var assert = require('chai').assert;
var crypto = require('crypto');

var Cryptography = dejavu.Class.declare({
	$name: 'Cryptography',
	$statics: {
		buildMasterKey: function(compositeHash, masterSeed, transformSeed, transformRounds) {
			assert.isString(compositeHash, 'Expected `compositeHash`to be a string');
			assert.isString(masterSeed, 'Expected `masterSeed` to be a string');
			assert.isString(transformSeed, 'Expected `transformSeed` to be a string');
			assert.isNumber(transformRounds, 'Expected `transformRounds` to be a string');

			// Transform composite hash
			var transformedHash = this.transformKey(compositeHash, transformSeed, '', transformRounds);
			transformedHash = crypto.createHash('sha256').update(transformedHash, 'binary').digest('binary');

			// Build master key
			var masterKey = masterSeed + transformedHash;
			masterKey = crypto.createHash('sha256').update(masterKey, 'binary').digest();

			return masterKey;
		},

		transformKey: function(key, seed, iv, rounds) {
			assert.isString(key, 'Expected `key` to be a string');
			assert.isString(seed, 'Expected `seed` to be a string');
			assert.isString(iv, 'Expected `iv` to be a string');
			assert.isNumber(rounds, 'Expected `rounds` to be a string');

			while(rounds--) {
				var cipher = crypto.createCipheriv('aes-256-ecb', seed, iv);
				cipher.setAutoPadding(false);
				key = cipher.update(key, 'binary', 'binary') + cipher.final('binary'); 
			}
			return key;
		}
	}
});

module.exports = Cryptography;