var should = require('should');
var helpers = require('./000_test_helpers');
var kpio = require('../lib');
var RawApi = require('../lib/KeePass/APIs/RawApi')

describe('Opening the example database', function() {
	var db = null, dbCompatApi = null;
	var dbPath = helpers.respath('000_example.kdbx');
	var kfPath = helpers.respath('000_example.key');
    
	before(function(done) {
		db = new kpio.Database();
		db.addCredential(new kpio.Credentials.Password('nebuchadnezzar'));
		db.addCredential(new kpio.Credentials.Keyfile(kfPath));
		db.loadFile(dbPath, function(err, api) {
			if(err) return done(err);
			dbCompatApi = api;
			return done();
		});
	});
	
	it('should provide compatibility layer method #getRaw()', function() {
		dbCompatApi.getRaw.should.be.an.instanceof(Function);
	});
	
	it('should provide compatibility layer method #setRaw()', function() {
		dbCompatApi.setRaw.should.be.an.instanceof(Function);
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
			
			it('should return the same data as the compatibility layer method #getRaw()', function() {
				var rawDb1 = JSON.stringify(dbCompatApi.getRaw());
				var rawDb2 = JSON.stringify(rawDatabase);
				rawDb1.should.be.equal(rawDb2);
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
			});
		});
		
		describe('and then calling compatibility layer method #setRaw()', function() {
			it('without any parameters should throw a KpioArgumentError', function() {
				(function() {
					dbCompatApi.setRaw();
				}).should.throw(kpio.Errors.Argument);
			});

			it('with a valid database should not throw any errors', function() {
				(function() {
					dbCompatApi.setRaw(rawDatabase || {});
				}).should.not.throw();
			});
		});
	});
});