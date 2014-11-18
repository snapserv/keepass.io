var should = require('should');
var helpers = require('./000_test_helpers');
var kpio = require('../lib');

describe('Opening the example database', function() {
	var dbPath = helpers.respath('000_example.kdbx');
	var kfPath = helpers.respath('000_example.key');
	var newDbPath = helpers.tmppath('010_new_example.kdbx');

	it('with invalid credentials should throw a KpioDatabaseError', function(done) {
		var db = new kpio.Database();
		db.addCredential(new kpio.Credentials.Password('morpheus'));
		db.loadFile(dbPath, function(err) {
			(function() {
				if(err) throw err;
			}).should.throw(kpio.Errors.Database);
			return done();
		});
	});

	describe('with valid credentials', function() {
		var db = null;

		before(function() {
			db = new kpio.Database();
			db.addCredential(new kpio.Credentials.Password('nebuchadnezzar'));
			db.addCredential(new kpio.Credentials.Keyfile(kfPath));
		});

		it('should not throw any errors', function(done) {
			db.loadFile(dbPath, function(err) {
				if(err) return done(err);
				return done();
			});
		});

		describe('and calling #saveFile()', function() {
			it('with the same credentials should not throw any error', function(done) {
				db.saveFile(newDbPath, function(err) {
					return done(err);
				});
			});

			it('with different credentials should not throw any error', function(done) {
				db.resetCredentials();
				db.addCredential(new kpio.Credentials.Password('morpheus'));

				db.saveFile(newDbPath, function(err) {
					return done(err);
				});
			});
		});
	});
});