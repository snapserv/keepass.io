'use strict';
var dejavu = require('dejavu');

var BaseApi = dejavu.AbstractClass.declare({
	$name: 'BaseApi',

	_database: null,
	__dirty: null,
	__container: null,

	/*
	 * These functions will be used by keepass.io internals, to pass and set references
	 * to the raw database object. Never use these functions under any circumstances
	 * within your code. I am not responsible for lost or corrupted databases,
	 * broken hearts, thermonuclear war or unfulfilled sexual partners.
	 */
	$passDatabase: function(container) {
		this.__container = container;
		this._database = container.db;
	},

	$storeDatabase: function(database) {
		this.__container.db = database;
		this.__container.dirty += 1;
		this._database = database;
	},

	$isDirty: function() {
		if(this.__container.dirty !== this.__dirty) {
			this.__dirty = this.__container.dirty;
			return true;
		}
		return false;
	}
});

module.exports = BaseApi;