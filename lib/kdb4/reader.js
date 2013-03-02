// Module dependencies
var Class = require('classjs'),
    crypto = require('crypto'),
    zlib = require('zlib'),
    common = require('../common'),
    IKDBReader = require('../kdb/reader'),
    KDB4Header = require('./header'),
    KDB4Xml = require('./xml'),
    HashedBlockIO = require('../hbio');

var KDB4Reader = Class.define({
    interfaces: [IKDBReader],

    /**
     * Class properties
     */
    properties: {
        isOpen: {
            type: "Boolean",
            init: false,
            set: false
        },
        buffer: {
            type: "Object",
            init: null,
            nullable: true,
            get: false
        },
        data: {
            type: "Object",
            init: null,
            nullable: true,
            set: false,
            get: false
        },
        credentials: {
            type: "Object",
            init: null,
            nullable: true,
            get: false
        },
        callback: {
            type: "Function",
            init: function() {},
            get: false,
            set: false
        },
        header: {
            type: "Object",
            init: null,
            nullable: true,
            get: false,
            set: false
        },
        masterKey: {
            type: "String",
            init: null,
            nullable: true,
            get: false,
            set: false
        },
        xml: {
            type: "Object",
            init: null,
            nullable: true,
            get: false,
            set: false
        }
    },

    members: {
        /**
         * Starts with reading the complete database and
         * generating a data object at the end
         */
        readDatabase: function(cb) {
            // Create a new KDB header and declare the fields
            this._setHeader(new KDB4Header({
                fields: {
                    'EndOfHeader': 0,
                    'Comment': 1,
                    'CipherID': 2,
                    'CompressionFlags': 3,
                    'MasterSeed': 4,
                    'TransformSeed': 5,
                    'TransformRounds': 6,
                    'EncryptionIV': 7,
                    'ProtectedStreamKey': 8,
                    'StreamStartBytes': 9,
                    'InnerRandomStreamID': 10
                },
                formats: {
                    3: '<I',
                    6: '<q'
                }
            }));

            // Read the header, create the masterkey and decrypt the database
            this._readHeader();
            this._createMasterKey();
            this._decrypt();
            if(this._getHeader().get('CompressionFlags') == 1) {
                var _this = this;
                this._decompress(function() {
                    _this._parse();
                });
            } else {
                this._parse();
            }
        },

        /**
         * Reads the database header
         * @private
         */
        _readHeader: function() {
            var offset = 12;
            var buffer = this._getBuffer();
            var header = this._getHeader();

            // Loop through all header fields
            while(true) {
                // Read field ID
                var fieldID = common.unpackBuffer(buffer, offset, 1, 'b');
                offset += 1;

                // Check if field ID exists in header declaration
                if(!header.checkID(fieldID)) {
                    throw new Error('Unknown header field found with ID: ' + fieldID);
                }

                // Get field length
                var fieldLength = common.unpackBuffer(buffer, offset, 2, 'h');
                offset += 2;
                if(fieldLength > 0) {
                    var fieldData = common.unpackBuffer(buffer, offset, fieldLength, fieldLength + 'A');
                    offset += fieldLength;
                    header.setBinary(fieldID, fieldData);
                }

                // Abort if field ID equals 0
                if(fieldID == 0) {
                    header.setLength(offset);
                    break;
                }
            }
        },

        /**
         * Creates a master key by combining multiple security elements
         * @private
         */
        _createMasterKey: function() {
            var compositeHash = this._getCredentials().getCompositeHash();
            var header = this._getHeader();

            // Transform composite hash n rounds
            var transformedKey = common.transformKey(
                compositeHash,
                header.get('TransformSeed'),
                header.get('TransformRounds')
            );

            // Create master key
            transformedKey = header.get('MasterSeed').toString('binary') + transformedKey;
            transformedKey = crypto.createHash('sha256').update(transformedKey, 'binary').digest('binary');
            this._setMasterKey(transformedKey);
        },

        /**
         * Decrypts the database
         * @private
         */
        _decrypt: function() {
            var header = this._getHeader();
            var cipher = crypto.createDecipheriv('aes-256-cbc', this._getMasterKey(), header.get('EncryptionIV'));
            var data = this._getBuffer().slice(header.getLength()).toString('binary');
            var iobuffer = null;

            // Decrypt data
            cipher.setAutoPadding(true);
            try {
                data = cipher.update(data, 'binary', 'binary') + cipher.final('binary');
            } catch(e) {
                throw new Error('Master key invalid.');
            }
            data = new Buffer(data, 'binary');

            // Check if decrypted data is valid (hashed block i/o)
            var startBytes = header.get('StreamStartBytes').toString('binary');
            if(startBytes == data.slice(0, startBytes.length).toString('binary')) {
                this._setData(new HashedBlockIO(data.slice(startBytes.length)));
                delete this._getBuffer();
                this.setBuffer(null);
                this._setIsOpen(true);
            } else {
                throw new Error('Master key invalid.');
            }
        },

        /**
         * Decompresses the database
         * @private
         */
        _decompress: function(cb) {
            var _this = this;

            zlib.gunzip(this._getData().getBuffer(), function(err, data) {
                if(err) throw err;

                _this._setData(data);
                if(cb && cb.constructor == Function) cb();
            });
        },

        /**
         * Parses the database
         * @private
         */
        _parse: function() {
            this._setXml(new KDB4Xml());
            this._getXml().setHeader(this._getHeader());
            this._getXml().parse(this._getData(), this._getCallback());
        }

    }
});
module.exports = KDB4Reader;