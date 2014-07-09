var should = require('should');
var crypto = require('crypto');
var helpers = require('./000_test_helpers');
var kpio = require('../lib');
var SalsaManager = require('../lib/Utility/SalsaManager');

describe('Instantiating a SalsaManager', function() {
	it('without any parameters should throw a KpioArgumentError', function() {
		(function() {
			new SalsaManager();
		}).should.throw(kpio.Errors.Argument);
	});

	it('with invalid parameter types should throw a KpioArgumentError', function() {
		(function() {
			new SalsaManager(1337, 'string');
		}).should.throw(kpio.Errors.Argument);
		(function() {
			new SalsaManager('string', 1337);
		}).should.throw(kpio.Errors.Argument);
	});

	describe('with predefined key and nonce', function() {
		var salsaManager = null;

		it('should not throw any errors', function() {
			(function() {
				salsaManager = new SalsaManager('morpheustrinityneonebuchadnezzar', 'morpheusapoctank');
			}).should.not.throw();
		});

		it('#getBytes(64) should match MD5 hash `016a37a54178adee4ca8508015c443b9`', function() {
			var hash = new Buffer(salsaManager.getBytes(64));
			hash = crypto.createHash('md5').update(hash).digest('hex');
			hash.should.equal('016a37a54178adee4ca8508015c443b9');
		});

		it('#unpack() without any parameters should throw a KpioArgumentError', function() {
			(function() {
				salsaManager.unpack();
			}).should.throw(kpio.Errors.Argument);
		});

		it('#unpack() with predefined input should match string `THE MATRIX`', function() {
			var value = new Buffer('/6LPNyksTiXLrA==', 'base64').toString('binary');
			value = salsaManager.unpack(value);
			value.should.equal('THE MATRIX');
		});
	});
});