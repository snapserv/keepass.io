'use strict';
var dejavu = require('dejavu');
var Errors = require('../Utility/Errors');

var KeePassApi = dejavu.Class.declare({
	$name: 'KeePassApi',

	__database: null,

	/**
	 * Returns a reference to the raw database as a JSON object. You can directly
	 * modify this object if you want to do so, which is actually the suggested way.
	 * As long as you are working with references, no problems should occur.
	 * 
	 * @return {object}
	 */
	getRaw: function() {
		return this.__database;
	},

	/**
	 * Overwrites the raw database with the given JSON object. You can use this function
	 * if needed, although only using getRaw() is recommended, because references should
	 * be usually sufficient to modify the database as you wish.
	 * 
	 * @param {object} database Raw database as JSON object
	 */
	setRaw: function(database) {
		if(typeof database !== 'object') throw new Errors.Argument('Expected `database` to be an Object');
		this.__database = database;
	},

	/*
	 * After this section, only internal functions will follow. They're used
	 * to connect the API with the rest of the library. Do not use them within
	 * your application, to avoid problems like missing error handling or breaking
	 * changes in future releases.
	 */
	$passDatabase: function(database) {
		this.__database = database;
	},

	$fetchDatabase: function() {
		return this.__database;
	}
});

module.exports = KeePassApi;