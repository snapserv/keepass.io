var should = require('should'),
    kpio = require('../lib'),
    errors = require('../lib/errors');

describe('Loading a database', function() {
    describe('without providing any credentials', function() {
        it('should throw a CredentialsError', function(done) {
            var db = new kpio();
            db.load(__dirname + '/data/inexistant.kdbx', function(err, result) {
                should.exist(err);
                should.not.exist(result);
                err.should.be.an.instanceof(errors.Credentials);
                done();
            });
        });
    });

    describe('with empty credentials', function() {
        it('should throw a CredentialsError', function() {
            (function() {
                var db = new kpio();
                db.setCredentials({});
            }).should.throw(errors.Credentials);
        });
    });

    describe('which does not exist', function() {
        it('should throw an IOError', function(done) {
            var db = new kpio();
            db.setCredentials({
                password: '123456'
            });

            db.load(__dirname + '/data/inexistant.kdbx', function(err, result) {
                should.exist(err);
                should.not.exist(result);
                err.should.be.an.instanceof(errors.IO);
                done();
            });
        });
    });

    describe('which has got an invalid header', function() {
        it('should throw an DatabaseError', function(done) {
            var db = new kpio();
            db.setCredentials({
                password: '123456'
            });

            db.load(__dirname + '/data/invalid.kdbx', function(err, result) {
                should.exist(err);
                should.not.exist(result);
                err.should.be.an.instanceof(errors.Database);
                done();
            });
        });
    });

    describe('which has got an unsupported version', function() {
        it('should throw an DatabaseError', function(done) {
            var db = new kpio();
            db.setCredentials({
                password: '123456'
            });

            db.load(__dirname + '/data/unsupported_version.kdbx', function(err, result) {
                should.exist(err);
                should.not.exist(result);
                err.should.be.an.instanceof(errors.Database);
                done();
            });
        });
    });

    describe('with an invalid master key', function() {
        it('should throw an CredentialsError', function(done) {
            var db = new kpio();
            db.setCredentials({
                password: '654321'
            });

            db.load(__dirname + '/data/test.kdbx', function(err, result) {
                should.exist(err);
                should.not.exist(result);
                err.should.be.an.instanceof(errors.Credentials);
                done();
            });
        });
    });
});

function loadTestDB(cb) {
    var db = new kpio();
    db.setCredentials({
        password: '123456'
    });

    db.load(__dirname + '/data/test.kdbx', function(err, result) {
        should.not.exist(err);
        should.exist(result);
        cb(err, result);
    });
}

describe('Loading the test database', function() {
    it('should be successful with the password \'123456\'', function(done) {
        loadTestDB(done);
    });

    it('should return a JSON object', function(done) {
        loadTestDB(function(err, data) {
            data.should.be.an.instanceof(Object);
            done();
        });
    });

    it('should return correct meta data', function(done) {
        loadTestDB(function(err, data) {
            data.should.be.an.instanceof(Object);
            data.meta.should.be.an.instanceof(Object);
            data.meta.dbName.should.equal('Test Name');
            data.meta.dbDescription.should.equal('Test Description');
            done();
        });
    });

    it('should return a group with 2 entries in it', function(done) {
        loadTestDB(function(err, data) {
            data.should.be.an.instanceof(Object);
            data.groups.should.be.an.instanceof(Object);

            var group = data.groups['Tey6uDYSQUCUpzBsHbrshw=='];
            group.should.be.an.instanceof(Object);
            group.entries.should.be.an.instanceof(Object);

            var entry1 = group.entries['TGCQ5xfOoUCV+yLGGCxM8g=='];
            var entry2 = group.entries['wGtcsTfSoEadz/fqbTy8Bg=='];
            entry1.should.be.an.instanceof(Object);
            entry2.should.be.an.instanceof(Object);

            entry1.title.should.equal('keepass.io');
            entry1.username.should.equal('will-it-work?');
            entry1.password.should.equal('yesitwill');

            entry2.title.should.equal('agent');
            entry2.username.should.equal('smith');
            entry2.password.should.equal('matrixtest');
            done();
        });
    });

    it('should parse extra fields from entries', function (done) {
        loadTestDB(function (err, data) {
            var group = data.groups['Tey6uDYSQUCUpzBsHbrshw=='];
            var entry = group.entries['wGtcsTfSoEadz/fqbTy8Bg=='];

            entry.fields.should.be.an.instanceof(Object);
            entry.fields['Credit Card Number'].should.equal("12345678910");
            entry.fields['Name on Card'].should.equal("Mr. Anderson");

            done();
        });
    });
});