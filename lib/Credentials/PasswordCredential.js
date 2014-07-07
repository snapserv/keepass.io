'use strict';
var dejavu = require('dejavu');
var assert = require('chai').assert;
var crypto = require('crypto');
var CredentialInterface = require('../Interfaces/CredentialInterface');

var PasswordCredential = dejavu.Class.declare({
	$name: 'PasswordCredential',
	$implements: [CredentialInterface],
	$constants: {
		PRIORITY: 200
	},

	__hashBuffer: null,

	initialize: function(rawPassword) {
		assert.isString(rawPassword, 'Expected `rawPassword` to be a string');

		this.__hashBuffer = crypto
			.createHash('sha256')
			.update(rawPassword, 'binary')
			.digest();
	},

	getHash: function() {
		return this.__hashBuffer;
	},

	getPriority: function() {
		return this.$static.PRIORITY;
	}
});

module.exports = PasswordCredential;