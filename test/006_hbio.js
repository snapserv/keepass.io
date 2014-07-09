var should = require('should');
var crypto = require('crypto');
var helpers = require('./000_test_helpers');
var kpio = require('../lib');
var HashedBlockIO = require('../lib/Utility/HashedBlockIO');

describe('Using HashedBlockIO', function() {
	describe('#decrypt() a buffer containing one block with 424 bytes', function() {
		var rawBuffer, hbioBuffer;

		before(function() {
			var dataBuffer = new Buffer(424);
			dataBuffer.fill(65);
			var blockHash = crypto.createHash('sha256').update(dataBuffer).digest('hex');

			var blockBuffer = new Buffer(40);
			blockBuffer.writeUInt32LE(0, 0);
			blockBuffer.write(blockHash, 4, 32, 'hex');
			blockBuffer.writeUInt32LE(424, 36);

			var endBlockBuffer = new Buffer(40);
			endBlockBuffer.fill(0);
			endBlockBuffer.writeUInt32LE(1, 0);
			endBlockBuffer.writeUInt32LE(0, 36);

			hbioBuffer = Buffer.concat([blockBuffer, dataBuffer, endBlockBuffer]);
		});

		it('should not throw any errors', function() {
			(function() {
				rawBuffer = HashedBlockIO.decrypt(hbioBuffer);	
			}).should.not.throw();			
		});

		it('should return a buffer with a size of 424 bytes', function() {
			rawBuffer.length.should.equal(424);
		});
	});

	describe('#encrypt() a buffer with 18000 bytes', function() {
		var rawBuffer, hbioBuffer;

		before(function() {
			rawBuffer = new Buffer(18000);
			rawBuffer.fill(65);
		});

		it('should not throw any errors', function() {
			(function() {
				hbioBuffer = HashedBlockIO.encrypt(rawBuffer);	
			}).should.not.throw();
		});

		it('should return a buffer with a size of 18120 bytes', function() {
			hbioBuffer.length.should.equal(18120);
		});

		describe('and calling #decrypt() with the result', function() {
			var decryptedRawBuffer;

			it('should not throw any errors', function() {
				(function() {
					decryptedRawBuffer = HashedBlockIO.decrypt(hbioBuffer);
				}).should.not.throw();
			});

			it('should be the same as the original buffer', function() {
				decryptedRawBuffer.toString('hex').should.equal(rawBuffer.toString('hex'));
			});
		});
	});
});