// Module dependencies
var Class = require('classjs'),
    crypto = require('crypto');

var Credentials = Class.define({
    /**
     * Class properties
     */
    properties: {
        compositeHash: {
            type: "String",
            init: null,
            nullable: true,
            set: false
        },
        keys: {
            type: "Array",
            init: [],
            get: false,
            set: false
        }
    },

    /**
     * Credentials constructor
     * @constructor
     * @param {Object} creds Object which contains password and/or keyfile key
     */
    constructor: function(creds) {
        if(creds.hasOwnProperty('password')) this._addPassword(creds.password);
        if(creds.hasOwnProperty('keyfile')) this._addKeyfile(creds.keyfile);

        if(this._getKeys().length == 0) {
            throw new Error('No credentials were given.');
        }
    },

    members: {
        /**
         * Generates the composite hash (hash which contains
         * the password and/or the keyfile)
         */
        generateCompositeHash: function() {
            var compositeHash = crypto.createHash('sha256')
                .update(this._getKeys().join(''), 'binary')
                .digest('binary');
            this._setCompositeHash(compositeHash);
        },

        /**
         * Adds a password to the credentials store
         * @param {String} password Password in binary form
         * @private
         */
        _addPassword: function(password) {
            var hashedKey = crypto.createHash('sha256')
                .update(password, 'binary')
                .digest('binary');
            this._getKeys().push(hashedKey);
        }
    }
});
module.exports = Credentials;