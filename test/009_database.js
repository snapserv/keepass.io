var should = require('should');
var helpers = require('./000_test_helpers');
var kpio = require('../lib');

describe('Instantiating a Database', function() {
	var database = null;

	before(function() {
		database = new kpio.Database();
	});

	it('and calling #resetCredentials() should not throw any errors', function() {
		(function() {
			database.resetCredentials();
		}).should.not.throw();
	});

	describe('and calling #loadFile()', function() {
		it('without any parameters should throw a KpioArgumentError', function() {
			(function() {
				database.loadFile();
			}).should.throw(kpio.Errors.Argument);
		});

		it('with invalid parameter types should throw a KpioArgumentError', function() {
			(function() {
				database.loadFile(1337, function() {});
			}).should.throw(kpio.Errors.Argument);
			(function() {
				database.loadFile('filename', 1337);
			}).should.throw(kpio.Errors.Argument);
		});

		it('with an inexistant file should throw a KpioGenericError', function() {
			(function() {
				database.loadFile('inexistant-file.kdbx', function() {});
			}).should.throw(kpio.Errors.Generic);
		});
	});

	describe('and calling #saveFile()', function() {
		it('without any parameters should throw a KpioArgumentError', function() {
			(function() {
				database.saveFile();
			}).should.throw(kpio.Errors.Argument);
		});

		it('with invalid parameter types should throw a KpioArgumentError', function() {
			(function() {
				database.saveFile(1337, function() {});
			}).should.throw(kpio.Errors.Argument);
			(function() {
				database.saveFile('filename', 1337);
			}).should.throw(kpio.Errors.Argument);
		});
	});

	describe('and calling #addCredential()', function() {
		before(function() {
			database.resetCredentials();
		});

		it('without a valid credential should throw a KpioArgumentError', function() {
			(function() {
				database.addCredential();
			}).should.throw(kpio.Errors.Argument);
		});

		it('with a valid credential should not throw any errors', function() {
			(function() {
				database.addCredential(new kpio.Credentials.Password('trinity'));
			}).should.not.throw();
		});
	});
});