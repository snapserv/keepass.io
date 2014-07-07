'use strict';
var dejavu = require('dejavu');
var assert = require('chai').assert;
var crypto = require('crypto');
var CredentialInterface = require('../Interfaces/CredentialInterface');

var CredentialStore = dejavu.Class.declare({
	$name: 'CredentialStore',

	__credentials: null,

	initialize: function() {
		this.reset();
	},

	add: function(credentialObject) {
		assert.isTrue(
			dejavu.instanceOf(credentialObject, CredentialInterface),
			'Expected `credentialObject` to implement CredentialInterface'
		);

		this.__credentials.push(credentialObject);
	},

	buildCompositeHash: function() {
		// Sort credentials by their priority
		this.__credentials = this.__credentials.sort(function(a, b) {
			if(a.getPriority() > b.getPriority()) {
				return -1;
			} else if(a.getPriority() < b.getPriority()) {
				return 1;
			} else {
				return 0;
			}
		});

		// Merge all credentials together and hash them with SHA256
		var compositeHash = crypto.createHash('sha256');
		this.__credentials.forEach(function(credential) {
			compositeHash.update(credential.getHash());
		});
		compositeHash = compositeHash.digest('binary');

		return compositeHash;
	},

	reset: function() {
		this.__credentials = [];
	}
});

module.exports = CredentialStore;