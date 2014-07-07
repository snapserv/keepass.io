'use strict';
var dejavu = require('dejavu');
var assert = require('chai').assert;
var crypto = require('crypto');
var fs = require('fs');
var CredentialInterface = require('../Interfaces/CredentialInterface');

var KeyfileCredential = dejavu.Class.declare({
	$name: 'KeyfileCredential',
	$implements: [CredentialInterface],
	$constants: {
		PRIORITY: 100
	},

	__hashBuffer: null,
	__isBinary: null,

	initialize: function(keyfilePath) {
		assert.isString(keyfilePath, 'Expected `keyfilePath` to be a string');
		assert.isTrue(fs.existsSync(keyfilePath), 'Expected `keyfilePath` to be a valid path to an existing file');

		var content = fs.readFileSync(keyfilePath);
		var result = content.toString('utf8').match(/<Data>(.*?)<\/Data>/);
		if(result && result.length === 2) {
			this.__isBinary = false;
			this.__hashBuffer = new Buffer(result[1], 'base64');
		} else {
			this.__isBinary = true;
			this.__hashBuffer = content;
		}
	},

	getType: function() {
		return this.__isBinary ? 'binary' : 'xml';
	},

	getHash: function() {
		return this.__hashBuffer;
	},

	getPriority: function() {
		return this.$static.PRIORITY;
	}
});

module.exports = KeyfileCredential;