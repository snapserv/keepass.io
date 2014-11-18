var should = require('should');
var helpers = require('./000_test_helpers');
var kpio = require('../lib');
var BasicApi = require('../lib/KeePass/APIs/BasicApi')

describe('Opening the example database', function() {
	var db = null;
	var dbPath = helpers.respath('000_example.kdbx');
	var kfPath = helpers.respath('000_example.key');
    
	before(function(done) {
		db = new kpio.Database();
		db.addCredential(new kpio.Credentials.Password('nebuchadnezzar'));
		db.addCredential(new kpio.Credentials.Keyfile(kfPath));
		db.loadFile(dbPath, function(err) {
			if(err) return done(err);
			return done();
		});
	});

	describe('and calling #getBasicApi()', function() {
		it('should return an instance of BasicApi', function() {
			db.getBasicApi().should.be.instanceof(BasicApi);
		});
		
		describe('and then calling #getGroupTree()', function() {
			it('should not throw any errors', function() {
				(function() {
					db.getBasicApi().getGroupTree();
				}).should.not.throw();
			});
			
			it('should return an Object', function() {
				db.getBasicApi().getGroupTree().should.be.an.instanceof(Object);
			});
		});
		
		describe('and then calling #setGroupTree()', function() {
			var backupTree = null;
			
			before(function() {
				backupTree = db.getBasicApi().getGroupTree();
			});
			
			it('with an empty array should not throw any errors', function() {
				(function() {
					db.getBasicApi().setGroupTree([]);
				}).should.not.throw();
			});
			
			it('with a valid group tree object should not throw any errors', function() {
				(function() {
					db.getBasicApi().setGroupTree(backupTree);
				}).should.not.throw();
			});
		});
		
		describe('and then calling #getGroup()', function() {
			it('with an inexistant UUID should throw an error', function() {
				(function() {
					db.getBasicApi().getGroup('does-not-exist-uuid');
				}).should.throw(kpio.Errors.Api);
			});
			
			it('with an existing UUID should not throw any errors', function() {
				(function() {
					db.getBasicApi().getGroup('Pl5s4tAbm0eiyg1aOOr0/A==');
				}).should.not.throw();
			});
		});
		
		describe('and then calling #setGroup()', function() {
			var backupGroup = null;
			
			before(function() {
				backupGroup = db.getBasicApi().getGroup('Pl5s4tAbm0eiyg1aOOr0/A==');
			});
			
			it('with an inexistant UUID should throw an error', function() {
				(function() {
					db.getBasicApi().setGroup('does-not-exist-uuid', {});
				}).should.throw(kpio.Errors.Api);
			});
			
			it('with an existing UUID should not throw any errors', function() {
				(function() {
					db.getBasicApi().setGroup('Pl5s4tAbm0eiyg1aOOr0/A==', backupGroup);
				}).should.not.throw();
			});
		});
		
		describe('and then calling #getEntries()', function() {
			it('with an inexistant group UUID should throw an error', function() {
				(function() {
					db.getBasicApi().getEntries('does-not-exist-uuid');
				}).should.throw(kpio.Errors.Api);
			});
			
			it('with an existing group UUID should not throw any errors', function() {
				(function() {
					db.getBasicApi().getEntries('Pl5s4tAbm0eiyg1aOOr0/A==');
				}).should.not.throw();
			});
		});
		
		describe('and then calling #setEntries()', function() {
			var backupEntries = null;
			
			before(function() {
				backupEntries = db.getBasicApi().getEntries('Pl5s4tAbm0eiyg1aOOr0/A==');
			});
			
			it('with an inexistant group UUID should throw an error', function() {
				(function() {
					db.getBasicApi().setEntries('does-not-exist-uuid', []);
				}).should.throw(kpio.Errors.Api);
			});
			
			it('with an existing group UUID and no entries should not throw any errors', function() {
				(function() {
					db.getBasicApi().setEntries('Pl5s4tAbm0eiyg1aOOr0/A==', []);
				}).should.not.throw();
			});
			
			it('with an existing group UUID and some entries should not throw any errors', function() {
				(function() {
					db.getBasicApi().setEntries('Pl5s4tAbm0eiyg1aOOr0/A==', backupEntries);
				}).should.not.throw();
			});
		});
		
		describe('and then calling #findOrphanedEntries()', function() {
			it('should return 0 entries', function() {
				var entries = db.getBasicApi().findOrphanedEntries();
				var count = 0;
				for(var key in entries) count += entries[key].length;
				
				count.should.equal(0);
			});
			
			describe('but deleting the whole tree with #setGroupTree() before', function() {
				it('should not throw any errors', function() {
					db.getBasicApi().setGroupTree([]);
				});
				
				it('should return 3 entries', function() {
					var entries = db.getBasicApi().findOrphanedEntries();
					var count = 0;
					for(var key in entries) count += entries[key].length;

					count.should.equal(3);
				});
			});
		});
		
		describe('and then calling #deleteOrphanedEntries()', function() {
			it('should not throw any errors', function() {
				db.getBasicApi().deleteOrphanedEntries();
			});
			
			describe('and finally calling #findOrphanedEntries()', function() {
				it('should return 0 entries', function() {
					var entries = db.getBasicApi().findOrphanedEntries();
					var count = 0;
					for(var key in entries) count += entries[key].length;

					count.should.equal(0);
				});
			});
		});
	});
});