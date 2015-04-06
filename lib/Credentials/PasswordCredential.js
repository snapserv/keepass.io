'use strict';
var dejavu = require('dejavu');
var crypto = require('crypto');
var Errors = require('../Utility/Errors');
var CredentialInterface = require('../Interfaces/CredentialInterface');

var PasswordCredential = dejavu.Class.declare({
	$name: 'PasswordCredential',
	$implements: [CredentialInterface],
	$constants: {
		PRIORITY: 200
	},

	__hashBuffer: null,

	initialize: function(rawPassword) {
		if(typeof rawPassword !== 'string') throw new Errors.Argument('Expected `rawPassword` to be a string');

		this.__hashBuffer = crypto
			.createHash('sha256')
			.update(new Buffer(rawPassword, 'utf-8'))
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
