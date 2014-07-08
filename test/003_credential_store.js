var should = require('should');
var crypto = require('crypto');
var helpers = require('./000_test_helpers');
var kpio = require('../lib');
var CredentialStore = require('../lib/Utility/CredentialStore');

describe('Instantiating a CredentialStore', function() {
	var credentialStore = new CredentialStore();

	describe('#add()', function() {
		it('should throw a KpioArgumentError when providing no credential', function() {
			(function() {
				credentialStore.add();
			}).should.throw(kpio.Errors.Argument);			
		});

		it('should not throw any errors when providing a valid credential', function() {
			(function() {
				credentialStore.add(new kpio.Credentials.Password('morpheus'));
			}).should.not.throw();
		});
	});

	describe('#buildCompositeHash()', function() {
		before(function() {
			credentialStore.reset();
		});

		it('should throw a KpioGenericError when no credentials were added', function() {
			(function() {
				credentialStore.buildCompositeHash();
			}).should.throw(kpio.Errors.Generic);
		});

		describe('when adding a PasswordCredential with `morpheus` before', function() {
			before(function() {
				credentialStore.add(new kpio.Credentials.Password('morpheus'));
			})

			it('should not throw any errors', function() {
				(function() {
					credentialStore.buildCompositeHash();
				}).should.not.throw();
			});

			it('should match MD5 hash `cb01f90e1116f24ec19711fd3339046f`', function() {
				var hash = credentialStore.buildCompositeHash();
				hash = crypto.createHash('md5').update(hash).digest('hex');
				hash.should.equal('cb01f90e1116f24ec19711fd3339046f');
			});
		});
	});

	describe('#reset()', function() {
		it('should not throw any errors', function() {
			(function() {
				credentialStore.reset();
			}).should.not.throw();
		});
	});
});