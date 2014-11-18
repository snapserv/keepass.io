'use strict';
var dejavu = require('dejavu');
var Errors = require('../../Utility/Errors');
var BaseApi = require('./BaseApi');

var RawApi = dejavu.Class.declare({
	$name: 'RawApi',
	$extends: BaseApi,

	/**
	 * Returns a copy of the raw database as a JSON object. You can directly modify
	 * whatever you want, however you have to call set() with the same object afterwards.
	 * To avoid conflicts with other APIs, pass by reference is not supported.
	 *
	 * @return {object}
	 */
	get: function() {
		return JSON.parse(JSON.stringify(this._database));
	},

	/**
	 * Replaces the raw database object with the given JSON object. You can use this function
	 * to save changes you have made to the database structure received from get(). Please make
	 * sure that this object is valid - there aren't any checks at all and you might corrupt
	 * your database if you pass in any invalid objects.
	 *
	 * @param {object} database Raw database as JSON object
	 */
	set: function(database) {
		if(typeof database !== 'object') throw new Errors.Argument('Expected `database` to be an Object');
		this.$storeDatabase(database);
	}
});

module.exports = RawApi;