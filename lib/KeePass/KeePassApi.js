'use strict';
var dejavu = require('dejavu');

var KeePassApi = dejavu.Class.declare({
	$name: 'KeePassApi',

	__database: null,

	passDatabase: function(database) {
		this.__database = database;
	},

	fetchDatabase: function() {
		return this.__database;
	},

	getRaw: function() {
		return this.__database;
	}
});

module.exports = KeePassApi;