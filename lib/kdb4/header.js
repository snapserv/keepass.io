// Module dependencies
var Class = require('classjs'),
    jspack = require('jspack').jspack,
    IKDBHeader = require('../kdb/header');

var KDB4Header = Class.define({
    interfaces: [IKDBHeader],

    /**
     * Class properties
     */
    properties: {
        length: {
            type: "Number",
            init: 0
        },
        fields: {
            type: "Object",
            init: {},
            get: false,
            set: false
        },
        formats: {
            type: "Object",
            init: {},
            get: false,
            set: false
        },
        data: {
            type: "Object",
            init: {},
            get: false,
            set: false
        }
    },

    constructor: function(options) {
        if(options.hasOwnProperty('fields')) this._setFields(options.fields);
        if(options.hasOwnProperty('formats')) this._setFormats(options.formats);

        for(var key in options.fields) {
            this._getData()[options.fields[key]] = undefined;
        }
    },

    members: {
        /**
         * Checks if the specified field ID is valid
         * @param {Number} id Field ID
         * @return {Boolean}
         */
        checkID: function(id) {
            return this._getData().hasOwnProperty(id);
        },

        /**
         * Sets the field with the specified ID
         * @param {Number} id Field ID
         * @param {*} value Value
         */
        set: function(id, value) {
            this._getData()[this._resolveField(id)] = value;
        },

        /**
         * Gets the field with the specified ID
         * @param {Number} id Field ID
         * @return {*}
         */
        get: function(id) {
            return this._getData()[this._resolveField(id)];
        },

        /**
         * Sets the field with the specified ID (binary / packed)
         * @param {Number} id Field ID
         * @param {*} value Value
         */
        setBinary: function(id, value) {
            if(this._getFormats().hasOwnProperty(id)) {
                this._getData()[this._resolveField(id)] = jspack.Unpack(
                    this._getFormats()[id], new Buffer(value), 0)[0];
            } else {
                this.set(id, value);
            }
        },

        /**
         * Gets the field with the specified ID (binary / unpacked)
         * @param {Number} id Field ID
         * @return {*}
         */
        getBinary: function(id) {
            if(this._getFormats().hasOwnProperty(id)) {
                return jspack.Pack(this._getFormats()[id], this._getData()[this._resolveField(id)]);
            } else {
                return this.get(id);
            }
        },

        /**
         * Resolves an ID or a string
         * @param {*} id Field ID or name
         */
        _resolveField: function(id) {
            if(this._getData().hasOwnProperty(id)) return id;
            if(this._getFields().hasOwnProperty(id)) return this._getFields()[id];
            throw new Error('Header field not found with ID: ' + id);
        }
    }
});
module.exports = KDB4Header;