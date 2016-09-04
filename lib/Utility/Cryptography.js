'use strict';
var dejavu = require('dejavu');
var crypto = require('crypto');
var Errors = require('./Errors');

// Try to include native key transformation library
try {
	var kpion = require('../../build/Release/kpion');
} catch(err) {}

var Cryptography = dejavu.Class.declare({
	$name: 'Cryptography',
	$statics: {
		buildMasterKey: function(compositeHash, masterSeed, transformSeed, transformRounds) {
			if(typeof compositeHash !== 'string') throw new Errors.Argument('Expected `compositeHash` to be a String');
			if(typeof masterSeed !== 'string') throw new Errors.Argument('Expected `masterSeed` to be a String');
			if(typeof transformSeed !== 'string') throw new Errors.Argument('Expected `transformSeed` to be a String');
			if(typeof transformRounds !== 'number') throw new Errors.Argument('Expected `transformRounds` to be a Number');

			// Choose between native and javascript key transformation
			if(kpion !== undefined) {
				var transformedHash = kpion.transformKey(
					new Buffer(compositeHash, 'binary'),
					new Buffer(transformSeed, 'binary'),
					transformRounds
				);
				transformedHash = new Buffer(transformedHash, 'hex').toString('binary');
			} else {
				var transformedHash = this.transformKey(compositeHash, transformSeed, '', transformRounds);
				transformedHash = crypto.createHash('sha256').update(transformedHash, 'binary').digest('binary');
			}

			// Build master key
			var masterKey = masterSeed + transformedHash;
			masterKey = crypto.createHash('sha256').update(masterKey, 'binary').digest('binary');
			masterKey = new Buffer(masterKey, 'binary');

			return masterKey;
		},

		transformKey: function(key, seed, iv, rounds) {
			if(typeof key !== 'string') throw new Errors.Argument('Expected `key` to be a String');
			if(typeof seed !== 'string') throw new Errors.Argument('Expected `seed` to be a String');
			if(typeof iv !== 'string') throw new Errors.Argument('Expected `iv` to be a String');
			if(typeof rounds !== 'number') throw new Errors.Argument('Expected `rounds` to be a Number');

			var seedBuf = new Buffer(seed, 'binary');

			while(rounds--) {
				var cipher = crypto.createCipheriv('aes-256-ecb', seedBuf, iv);
				cipher.setAutoPadding(false);
				key = cipher.update(key, 'binary', 'binary') + cipher.final('binary');
			}
			return key;
		}
	}
});

module.exports = Cryptography;
