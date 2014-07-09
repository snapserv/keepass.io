'use strict';
var dejavu = require('dejavu');
var fs = require('fs');
var Errors = require('./Utility/Errors');
var CredentialStore = require('./Utility/CredentialStore');
var KeePassDatabase = require('./KeePass/KeePassDatabase');

var Database = dejavu.Class.declare({
	$name: 'Database',

	_credentialStore: null,
	_kpDatabase: null,

	initialize: function() {
		this._credentialStore = new CredentialStore();
		this._kpDatabase = new KeePassDatabase();
	},

	loadFile: function(filePath, callback) {
		if(typeof filePath !== 'string') throw new Errors.Argument('Expected `filePath` to be a String');
		if(typeof callback !== 'function') throw new Errors.Argument('Expected `callback` to be a Function');
		if(!fs.existsSync(filePath)) {
			throw new Errors.Generic('Database file does not exist: ' + filePath);
		}

		fs.readFile(filePath, function(err, content) {
			if(err) {
				return callback(new Errors.Generic('Could not open database file: ' + err.toString()));
			}
			this._kpDatabase.load(content, this._credentialStore, function(err) {
				return callback(err, this._kpDatabase.getApi());
			}.$bind(this));
		}.$bind(this));
	},

	saveFile: function(filePath, callback) {
		if(typeof filePath !== 'string') throw new Errors.Argument('Expected `filePath` to be a String');
		if(typeof callback !== 'function') throw new Errors.Argument('Expected `callback` to be a Function');

		this._kpDatabase.save(this._credentialStore, function(err, content) {
			fs.writeFile(filePath, content, function(err) {
				return callback(err);
			});
		});
	},

	addCredential: function(credentialObject) {
		this._credentialStore.add(credentialObject);
	},

	resetCredentials: function() {
		this._credentialStore.reset();
	}
});

module.exports = Database;