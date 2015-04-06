var should = require('should');
var crypto = require('crypto');
var helpers = require('./000_test_helpers');
var kpio = require('../lib');

describe('Instantiating a PasswordCredential', function()  {
	it('should throw a KpioArgumentError when providing no password', function() {
		(function() {
			new kpio.Credentials.Password();
		}).should.throw(kpio.Errors.Argument);
	});

	it('should throw a KpioArgumentError when providing an invalid type', function() {
		(function() {
			new kpio.Credentials.Password([]);
		}).should.throw(kpio.Errors.Argument);
	});

	describe('by providing the password `nebuchadnezzar`', function() {
		var credential = null;

		it('should not throw any errors', function() {
			(function() {
				credential = new kpio.Credentials.Password('nebuchadnezzar');
			}).should.not.throw();
		});

		it('#getHash() should match MD5 hash `ebdaa59b9b8b28d10847d04c7159a145`', function() {
			var hash = credential.getHash();
			hash = crypto.createHash('md5').update(hash).digest('hex');
			hash.should.equal('ebdaa59b9b8b28d10847d04c7159a145');
		});
	});

    describe('by providing the password `ü`', function () {
		var credential = null;

		it('should not throw any errors', function() {
			(function() {
				credential = new kpio.Credentials.Password('ü');
			}).should.not.throw();
		});

		it('#getHash() should match MD5 hash `ebdaa59b9b8b28d10847d04c7159a145`', function() {
			var hash = credential.getHash();
			hash = crypto.createHash('md5').update(hash).digest('hex');
			hash.should.equal('c6afd37d6a9308af8709cf0d250b888e');
		});
    });
});
