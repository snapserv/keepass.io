'use strict';
var dejavu = require('dejavu');
var crypto = require('crypto');
var Errors = require('./Errors');
var CredentialInterface = require('../Interfaces/CredentialInterface');

var CredentialStore = dejavu.Class.declare({
	$name: 'CredentialStore',

	__credentials: null,

	initialize: function() {
		this.reset();
	},

	add: function(credentialObject) {
		if(!dejavu.instanceOf(credentialObject, CredentialInterface)) {
			throw new Errors.Argument('Expected `credentialObject` to implement CredentialInterface')
		}

		this.__credentials.push(credentialObject);
	},

	buildCompositeHash: function() {
		// Check if there are any credentials
		if(!this.__credentials || this.__credentials.length < 1) {
			throw new Errors.Generic('Can not build composite hash when no credentials were given');
		}

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
		compositeHash = compositeHash.digest();

		return compositeHash;
	},

	reset: function() {
		this.__credentials = [];
	}
});

module.exports = CredentialStore;