'use strict';
var dejavu = require('dejavu');
var Salsa20 = require('./Salsa20');
var Errors = require('./Errors');

var SalsaManager = dejavu.Class.declare({
	$name: 'SalsaManager',

	__instance: null,
	__buffer: [],

	initialize: function(key, nonce) {
		if(typeof key !== 'string' && !Array.isArray(key) && !(key instanceof Buffer)) {
			throw new Errors.Argument('Expected `key` to be a String, Array or Buffer');
		}
		if(typeof nonce !== 'string' && !Array.isArray(nonce) && !(nonce instanceof Buffer)) {
			throw new Errors.Argument('Expected `nonce` to be a String, Array or Buffer');
		}
		this.__instance = new Salsa20(key, nonce);
	},

	unpack: function(payload) {
		if(typeof payload !== 'string') throw new Errors.Argument('Expected `payload` to be a String');

		var result = '';
		var salsaBytes = this.getBytes(payload.length);
		
		for(var i = 0; i < payload.length; i++) {
			result += String.fromCharCode(salsaBytes[i] ^ payload.charCodeAt(i));
		}
		return result;
	},

	getBytes: function(length) {
		if(typeof length !== 'number') throw new Errors.Argument('Expected `length` to be a Number');

		while(length > this.__buffer.length) {
			this.__buffer.push.apply(this.__buffer, this.__instance.getBytes(64));
		}
		return this.__buffer.splice(0, length);
	}
});

module.exports = SalsaManager;