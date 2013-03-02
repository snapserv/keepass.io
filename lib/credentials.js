// Module dependencies
var Class = require('classjs'),
    crypto = require('crypto'),
    fs = require('fs'),
    errors = require('./errors');

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
        this._setKeys([]);
        if(creds.hasOwnProperty('password')) this._addPassword(creds.password);
        if(creds.hasOwnProperty('keyfile')) this._addKeyfile(creds.keyfile);

        if(this._getKeys().length == 0) {
            throw new errors.Credentials('No credentials were given.');
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
        },

        /**
         * Adds a keyfile to the credentials store
         * @param {String} keyfile Path to keyfile
         * @private
         */
        _addKeyfile: function(keyfile) {
            var content = fs.readFileSync(keyfile).toString();
            var key = content.match(/<Data>(.*?)<\/Data>/)[1];
            key = new Buffer(key, 'base64').toString('binary');

            this._getKeys().push(key);
        }
    }
});
module.exports = Credentials;