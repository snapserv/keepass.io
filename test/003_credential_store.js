var should = require('should');
var dejavu = require('dejavu');
var crypto = require('crypto');
var helpers = require('./000_test_helpers');
var kpio = require('../lib');
var CredentialStore = require('../lib/Utility/CredentialStore')
var CredentialInterface = require('../lib/Interfaces/CredentialInterface');

var LowPriorityCredential = dejavu.Class.declare({
	$name: 'LowPriorityCredential',
	$implements: [CredentialInterface],
	$constants: {
		PRIORITY: 10
	},

	initialize: function() {},
	getHash: function() { return 'lowPriority'; },
	getPriority: function() { return this.$static.PRIORITY; }
});

var HighPriorityCredential = dejavu.Class.declare({
	$name: 'HighPriorityCredential',
	$implements: [CredentialInterface],
	$constants: {
		PRIORITY: 20
	},

	initialize: function() {},
	getHash: function() { return 'highPriority'; },
	getPriority: function() { return this.$static.PRIORITY; }
});

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
			});

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

		describe('when adding two credentials with different priorities', function() {
			before(function() {
				credentialStore.reset();
				credentialStore.add(new LowPriorityCredential());
				credentialStore.add(new HighPriorityCredential());
			});

			it('should not throw any errors', function() {
				(function() {
					credentialStore.buildCompositeHash();
				}).should.not.throw();
			});

			it('should match MD5 hash `0f33bbd1f87e70d925e7178974198fc7` to prove correct order', function() {
				var hash = credentialStore.buildCompositeHash();
				hash = crypto.createHash('md5').update(hash).digest('hex');
				hash.should.equal('0f33bbd1f87e70d925e7178974198fc7');
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