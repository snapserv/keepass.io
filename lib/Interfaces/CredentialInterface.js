'use strict';
var dejavu = require('dejavu');

var CredentialInterface = dejavu.Interface.declare({
	$name: 'CredentialInterface',

	getHash: function() {},
	getPriority: function() {}
});

module.exports = CredentialInterface;