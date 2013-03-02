// Module dependencies
var Class = require('classjs'),
    fs = require('fs'),
    common = require('./common'),
    Credentials = require('./credentials'),
    errors = require('./errors');

/**
 * KeePass base signature (does or should not change)
 * @type {Number}
 */
var BASE_SIGNATURE = 0x9AA2D903;

/**
 * Specifies all the supported database versions,
 * they are determined by the second signature value
 * @type {Object}
 */
var SUPPORTED_VERSIONS = {
    0xB54BFB67: {
        reader: require('./kdb4/reader')
    }
};

var KeePassIO = Class.define({
    /**
     * Class properties
     */
    properties: {
        loading: {
            type: "Boolean",
            init: false,
            get: false,
            set: false
        },
        filename: {
            type: "String",
            init: null,
            nullable: true,
            get: false,
            set: false
        },
        callback: {
            type: "Function",
            init: function() {},
            get: false,
            set: false
        },
        credentials: {
            type: "Object",
            init: null,
            nullable: true,
            get: false,
            set: false
        },
        fileBuffer: {
            type: "Object",
            init: null,
            nullable: true,
            get: false,
            set: false
        },
        reader: {
            type: "Object",
            init: null,
            nullable: true,
            get: false,
            set: false
        }
    },

    members: {
        /**
         * Sets the credentials which should be used
         * to open the database and generates a new
         * composite hash
         * @param {Object} creds Object which contains the credentials
         */
        setCredentials: function(creds) {
            var credentials = new Credentials(creds);
            credentials.generateCompositeHash();
            this._setCredentials(credentials);
        },

        /**
         * Loads a new database, credentials must be
         * specified first. Can only be called once
         * per instance.
         * @param {String} filename Filename of the database
         * @param {Function} cb Callback function
         */
        load: function(filename, cb) {
            // Check if a database was already loaded
            if(this._getLoading() === true) {
                return cb(new errors.Database('Only one database can be loaded per instance.'));
            }
            this._setLoading(true);

            // Store filename and callback in class instance
            this._setFilename(filename);
            this._setCallback(cb);

            // Check if credentials were set
            if(!this._getCredentials()) {
                return this._getCallback()(
                    new errors.Credentials('No credentials were given.')
                );
            }

            // Check if a file exists
            var _this = this;
            fs.exists(this._getFilename(), function(exists) {
                if(!exists) {
                    return  _this._getCallback()(
                        new errors.IO('Database does not exist.')
                    );
                }

                // Read file and check database signature
                fs.readFile(_this._getFilename(), function(err, buffer) {
                    if(err) {
                        return _this._getCallback()(
                            new errors.IO(err.toString())
                        );
                    }

                    _this._setFileBuffer(buffer);
                    _this._readSignature();
                });
            });
        },

        /**
         * Reads and verifies the database header
         * signature. It will also proceed with
         * loading the database by instantiating
         * the correct database reader.
         * @private
         */
        _readSignature: function() {
            // Check base signature
            var sigs = common.readSignature(this._getFileBuffer());
            if(!sigs || sigs[0] != BASE_SIGNATURE) {
                return this._getCallback()(
                    new errors.Database('Invalid database file. Base signature does not match.')
                );
            }

            // Check if the database version is supported (second signature)
            if(!SUPPORTED_VERSIONS.hasOwnProperty(sigs[1])) {
                return this._getCallback()(
                    new errors.Database('Sorry, your database version is not supported.')
                );
            }

            // Instantiate the correct database reader
            var reader = new SUPPORTED_VERSIONS[sigs[1]].reader();
            this._setReader(reader);

            // Start with reading the database
            reader.setBuffer(this._getFileBuffer());
            reader.setCredentials(this._getCredentials());
            reader.readDatabase(this._getCallback());
        }
    }

});

module.exports = KeePassIO;
