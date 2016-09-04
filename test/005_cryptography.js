var should = require('should');
var crypto = require('crypto');
var helpers = require('./000_test_helpers');
var kpio = require('../lib');
var Cryptography = require('../lib/Utility/Cryptography');

// Try to include native key transformation library
try {
	var kpion = require('../build/Release/kpion');
} catch(err) {}

describe('Transforming the key `nebuchadnezzarneotrinitymorpheus`', function() {
	var key = 'nebuchadnezzarneotrinitymorpheus';
	var seed = 'morpheusmorpheusmorpheusmorpheus';
	var iv = '';

	describe('with the Node.js method', function() {
		it('and 0 rounds should match MD5 hash `c2d9e5c83d750702ba8b26b30d612cbc`', function() {
			var hash = Cryptography.transformKey(key, seed, iv, 0);
			hash = crypto.createHash('md5').update(hash).digest('hex');
			hash.should.equal('c2d9e5c83d750702ba8b26b30d612cbc');
		});

		it('and 500 rounds should match MD5 hash `81c673b0dc17ba4d1a674298fa679d5d`', function() {
			var hash = Cryptography.transformKey(key, seed, iv, 500);
			hash = new Buffer(hash, 'binary');
			hash = crypto.createHash('md5').update(hash).digest('hex');
			hash.should.equal('81c673b0dc17ba4d1a674298fa679d5d');
		});

		it('and 1000 rounds should match MD5 hash `e19a4a8b5ed0f14d5061571a8591517d`', function() {
			var hash = Cryptography.transformKey(key, seed, iv, 1000);
			hash = new Buffer(hash, 'binary');
			hash = crypto.createHash('md5').update(hash).digest('hex');
			hash.should.equal('e19a4a8b5ed0f14d5061571a8591517d');
		});
	});

	describe('with the native key transformation library', function() {
		var keyBuffer, seedBuffer;

		before(function() {
			keyBuffer = new Buffer(key, 'binary');
			seedBuffer = new Buffer(seed, 'binary');	
		});

		function maybeIt(desc, fn) {
			if(kpion !== undefined) {
				return it(desc, fn);
			} else {
				return it.skip(desc, fn);
			}
		}

		maybeIt('and 0 rounds should match MD5 hash `27ce4f30c0eb49372b51f54cc0a88998`', function() {
			var hash = kpion.transformKey(keyBuffer, seedBuffer, 0);
			hash = new Buffer(hash, 'hex');	// Node.js v0.8.x workaround - see https://github.com/joyent/node/issues/4128
			hash = crypto.createHash('md5').update(hash).digest('hex');
			hash.should.equal('27ce4f30c0eb49372b51f54cc0a88998');
		});

		maybeIt('and 500 rounds should match MD5 hash `e88bdbde00dae90ffe5f885748797487`', function() {
			var hash = kpion.transformKey(keyBuffer, seedBuffer, 500);
			hash = new Buffer(hash, 'hex');	// Node.js v0.8.x workaround - see https://github.com/joyent/node/issues/4128
			hash = crypto.createHash('md5').update(hash).digest('hex');
			hash.should.equal('e88bdbde00dae90ffe5f885748797487');
		});

		maybeIt('and 1000 rounds should match MD5 hash `09cc3aabadb8b7cccf3031518114f29e`', function() {
			var hash = kpion.transformKey(keyBuffer, seedBuffer, 1000);
			hash = new Buffer(hash, 'hex');	// Node.js v0.8.x workaround - see https://github.com/joyent/node/issues/4128
			hash = crypto.createHash('md5').update(hash).digest('hex');
			hash.should.equal('09cc3aabadb8b7cccf3031518114f29e');
		});
	});
});

describe('Building a masterkey with predefined values', function() {
	var masterKey = null;

	it('should not throw any errors', function() {
		var compositeHash = 'nebuchadnezzarneotrinitymorpheus';
		var masterSeed = 'trinityapoctrinityapoctrinityapoc';
		var transformSeed = 'morpheusmorpheusmorpheusmorpheus';
		var transformRounds = 1000;
		masterKey = Cryptography.buildMasterKey(compositeHash, masterSeed, transformSeed, transformRounds);
	});

	it('should match `c0153df85e6118fb19a8abfcde44a8fe66076fc364a86f81e72880d76aa4dff0`', function() {
		masterKey = masterKey.toString('hex');
		masterKey.should.equal('c0153df85e6118fb19a8abfcde44a8fe66076fc364a86f81e72880d76aa4dff0');
	});
});