'use strict';
var dejavu = require('dejavu');
var assert = require('chai').assert;
var fs = require('fs');
var CredentialStore = require('./Utility/CredentialStore');

var Database = dejavu.Class.declare({
	$name: 'Database',

	_credentialStore: null,

	initialize: function() {
		this._credentialStore = new CredentialStore();
	},

	loadFile: function(filePath) {
		assert.isString(filePath, 'Expected `filePath` to be a string');
		assert.isTrue(fs.existsSync(filePath), 'Expected `filePath` to be a valid path to an existing file');
	},

	addCredential: function(credentialObject) {
		this._credentialStore.add(credentialObject);
	},

	resetCredentials: function() {
		this._credentialStore.reset();
	}
});

module.exports = Database;