var should = require('should');
var crypto = require('crypto');
var helpers = require('./000_test_helpers');
var kpio = require('../lib');
var Cryptography = require('../lib/Utility/Cryptography');

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
			hash = crypto.createHash('md5').update(hash).digest('hex');
			hash.should.equal('81c673b0dc17ba4d1a674298fa679d5d');
		});

		it('and 1000 rounds should match MD5 hash `e19a4a8b5ed0f14d5061571a8591517d`', function() {
			var hash = Cryptography.transformKey(key, seed, iv, 1000);
			hash = crypto.createHash('md5').update(hash).digest('hex');
			hash.should.equal('e19a4a8b5ed0f14d5061571a8591517d');
		});
	});
});