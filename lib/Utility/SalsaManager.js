'use strict';
var dejavu = require('dejavu');
var Salsa20 = require('./Salsa20');

var SalsaManager = dejavu.Class.declare({
	$name: 'SalsaManager',

	__instance: null,
	__buffer: [],

	initialize: function(key, nonce) {
		this.__instance = new Salsa20(key, nonce);
	},

	unpack: function(payload) {
		var result = '';
		var salsaBytes = this.getBytes(payload.length);
		
		for(var i = 0; i < payload.length; i++) {
			result += String.fromCharCode(salsaBytes[i] ^ payload.charCodeAt(i));
		}
		return result;
	},

	getBytes: function(length) {
		while(length > this.__buffer.length) {
			this.__buffer.push.apply(this.__buffer, this.__instance.getBytes(64));
		}
		return this.__buffer.splice(0, length);
	}
});

module.exports = SalsaManager;