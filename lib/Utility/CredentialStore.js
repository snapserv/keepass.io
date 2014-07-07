'use strict';
var dejavu = require('dejavu');
var assert = require('chai').assert;
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

	reset: function() {
		this.__credentials = [];
	}
});

module.exports = CredentialStore;