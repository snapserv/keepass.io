var should = require('should');
var helpers = require('./000_test_helpers');
var kpio = require('../lib');
var RawApi = require('../lib/KeePass/APIs/RawApi')

describe('Opening the example database', function() {
	var db = null;
	var dbPath = helpers.respath('000_example.kdbx');
	var kfPath = helpers.respath('000_example.key');
	var newDbPath = helpers.tmppath('010_new_example.kdbx');
    
	before(function(done) {
		db = new kpio.Database();
		db.addCredential(new kpio.Credentials.Password('nebuchadnezzar'));
		db.addCredential(new kpio.Credentials.Keyfile(kfPath));
		db.loadFile(dbPath, function(err) {
			if(err) return done(err);
			return done();
		});
	});

	describe('and calling #getRawApi()', function() {
		var rawDatabase = null;

		it('should return an instance of RawApi', function() {
			db.getRawApi().should.be.instanceof(RawApi);
		});

		describe('and then calling #get()', function() {
			it('should not throw any errors', function() {
				(function() {
					rawDatabase = db.getRawApi().get();    
				}).should.not.throw();
			});

			it('should return an Object', function() {
				rawDatabase.should.be.an.instanceof(Object);
			});

			it('should return a raw database with the name "KeePassIO Development Database"', function() {
				rawDatabase.KeePassFile.Meta.DatabaseName.should.equal('KeePassIO Development Database');
			});
		});

		describe('and then calling #set()', function() {
			it('without any parameters should throw a KpioArgumentError', function() {
				(function() {
					db.getRawApi().set();
				}).should.throw(kpio.Errors.Argument);
			});

			it('with a valid database should not throw any errors', function() {
				(function() {
					db.getRawApi().set(rawDatabase || {});
				}).should.not.throw();
			})
		})
	});
});