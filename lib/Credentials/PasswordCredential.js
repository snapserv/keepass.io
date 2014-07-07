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
		assert.isString(rawPassword);
		this.__hashBuffer = crypto
			.createHash('sha256')
			.update(rawPassword, 'binary')
			.digest('binary');
	},

	getHash: function() {
		return this.__hashBuffer;
	},

	getPriority: function() {
		return this.$static.PRIORITY;
	}
});

module.exports = PasswordCredential;