var should = require('should');
var helpers = require('./000_test_helpers');
var kpio = require('../lib');
var Salsa20 = require('../lib/Utility/Salsa20');

describe('Initializing the Salsa20 cipher', function() {
	describe('with a key of 0x80 followed by 31 times 0x00', function() {
		var i = 0;
		var key = [0x80]; for(i = 1; i < 32; i++) key[i] = 0;
		var nonce = []; for(i = 0; i < 8; i++) nonce[i] = 0;
		var cipher = new Salsa20(key, nonce);

		it('should match the first set of 64 bytes', function() {
			var correctBytes = [
				'e3be8fdd8beca2e3ea8ef9475b29a6e7',
				'003951e1097a5c38d23b7a5fad9f6844',
				'b22c97559e2723c7cbbd3fe4fc8d9a07',
				'44652a83e72a9c461876af4d7ef1a117'
			].join('');

			cipher.getHexString(64).should.be.exactly(correctBytes);
		});

		it('should match the second set of 64 bytes', function() {
			var correctBytes = [
				'57be81f47b17d9ae7c4ff15429a73e10',
				'acf250ed3a90a93c711308a74c6216a9',
				'ed84cd126da7f28e8abf8bb63517e1ca',
				'98e712f4fb2e1a6aed9fdc73291faa17'
			].join('');

			cipher.getBytes(128);
			cipher.getHexString(64).should.be.exactly(correctBytes);
		});

		it('should match the third set of 64 bytes', function() {
			var correctBytes = [
				'958211c4ba2ebd5838c635edb81f513a',
				'91a294e194f1c039aeec657dce40aa7e',
				'7c0af57cacefa40c9f14b71a4b3456a6',
				'3e162ec7d8d10b8ffb1810d71001b618'
			].join('');

			cipher.getHexString(64).should.be.exactly(correctBytes);
		});

		it('should match the fourth set of 64 bytes', function() {
			var correctBytes = [
				'696afcfd0cddcc83c7e77f11a649d79a',
				'cdc3354e9635ff137e929933a0bd6f53',
				'77efa105a3a4266b7c0d089d08f1e855',
				'cc32b15b93784a36e56a76cc64bc8477'
			].join('');

			cipher.getBytes(128);
			cipher.getHexString(64).should.be.exactly(correctBytes);
		});
	});
});