// Module dependencies
var Class = require('classjs'),
    xml2js = require('xml2js'),
    crypto = require('crypto'),
    Salsa20 = require('../salsa20');

/**
 * Salsa initialization vector (should not chagne in future versions)
 * @type {Array}
 */
var SALSA_IV = [0xe8, 0x30, 0x09, 0x4b, 0x97, 0x20, 0x5d, 0x2a];

/**
 * Converts a buffer into a byte array
 * @extends Buffer
 * @return {Array}
 */
Buffer.prototype.toByteArray = function() {
    return Array.prototype.slice.call(this, 0);
};

var KDB4Xml = Class.define({
    /**
     * Class properties
     */
    properties: {
        header: {
            type: "Object",
            init: null,
            nullable: true,
            set: true,
            get: false
        },
        salsa: {
            type: "Object",
            init: null,
            nullable: true,
            set: false,
            get: false
        },
        salsaBuffer: {
            type: "Array",
            init: [],
            set: false,
            get: false
        }
    },

    members: {
        /**
         * Parses the specified buffer
         * @param {Buffer} buffer Buffer which contains XML data
         * @param {Function} cb Callback
         */
        parse: function(buffer, cb) {
            var _this = this;

            xml2js.parseString(buffer, function(err, data) {
                if(err) throw err;

                // Tidy up JSON data and extract the useful data from it
                _this._resetSalsa();
                data = _this._tidy(data.KeePassFile);
                if(cb && cb.constructor == Function) cb(null, data);
            });
        },

        /**
         * Tidy up the JSON data (extracts the useful data
         * from it and reorders the data)
         * @param {Object} data JSON data
         * @private
         */
        _tidy: function(data) {
            var _this = this;
            var d = {};

            // Database meta data
            var meta = data.Meta[0];
            d.meta = {
                generator: this._string(meta.Generator[0]),

                dbName: this._string(meta.DatabaseName[0]),
                dbNameChanged: this._date(meta.DatabaseNameChanged[0]),
                dbDescription: this._string(meta.DatabaseDescription[0]),
                dbDescriptionChanged: this._date(meta.DatabaseDescriptionChanged[0]),

                defaultUser: this._string(meta.DefaultUserName[0]),
                defaultUserChanged: this._date(meta.DefaultUserNameChanged[0]),
                maintenanceHistoryDays: this._number(meta.MaintenanceHistoryDays[0]),

                masterKeyChanged: this._date(meta.MasterKeyChanged[0]),
                masterKeyChangeRec: this._number(meta.MasterKeyChangeRec[0]),
                masterKeyChangeForce: this._number(meta.MasterKeyChangeForce[0]),

                recycleBinEnabled: this._boolean(meta.RecycleBinEnabled[0]),
                recycleBinUUID: this._string(meta.RecycleBinUUID[0]),
                recycleBinChanged: this._date(meta.RecycleBinChanged[0]),

                entryTemplatesGroup: this._string(meta.EntryTemplatesGroup[0]),
                entryTemplatesGroupChanged: this._date(meta.EntryTemplatesGroupChanged[0]),

                historyMaxItems: this._number(meta.HistoryMaxItems[0]),
                historyMaxSize: this._number(meta.HistoryMaxSize[0]),
                lastSelectedGroup: this._string(meta.LastSelectedGroup[0]),
                lastTopVisibleGroup: this._string(meta.LastTopVisibleGroup[0])
            };

            // Database entries
            function parseEntries(entries, isHistory) {
                var result = isHistory ? [] : {};

                entries.forEach(function(entry) {
                    var UUID = _this._string(entry.UUID[0]);
                    var times = entry.Times[0];

                    // Parse entry keys
                    var keys = {};
                    entry.String.forEach(function(keyValuePair) {
                        keys[keyValuePair.Key[0]] = keyValuePair.Value[0];
                    });

                    // Entry meta data
                    var newEntry = {
                        title: _this._string(keys.Title),
                        url: _this._string(keys.URL),
                        username: _this._string(keys.UserName),
                        notes: _this._string(keys.Notes),

                        lastModificationTime: _this._date(times.LastModificationTime[0]),
                        creationTime: _this._date(times.CreationTime[0]),
                        lastAccessTime: _this._date(times.LastAccessTime[0]),
                        expiryTime: _this._date(times.ExpiryTime[0]),
                        expires: _this._boolean(times.Expires[0]),
                        usageCount: _this._number(times.UsageCount[0]),
                        locationChanged: _this._date(times.LocationChanged[0]),

                        iconID: _this._number(entry.IconID[0])
                    };

                    // Entry password
                    var password = keys.Password;
                    if(_this._boolean(password.$.Protected)) {
                        newEntry.password = _this._unprotect(password._);
                    } else {
                        newEntry.password = password._;
                    }

                    // History
                    if(entry.History && entry.History[0].Entry) {
                        newEntry.history = parseEntries(entry.History[0].Entry, true);
                    }

                    // Is entry in history or not?
                    if(isHistory) {
                        result.push(newEntry);
                    } else {
                        result[UUID] = newEntry;
                    }
                });

                return result;
            }

            // Database groups
            function parseGroups(groups) {
                var result = {};

                groups.forEach(function(group) {
                    var UUID = _this._string(group.UUID[0]);
                    var times = group.Times[0];

                    // Group meta data
                    result[UUID] = {
                        name: _this._string(group.Name[0]),
                        notes: _this._string(group.Notes[0]),
                        iconID: _this._number(group.IconID[0]),

                        lastModificationTime: _this._date(times.LastModificationTime[0]),
                        creationTime: _this._date(times.CreationTime[0]),
                        lastAccessTime: _this._date(times.LastAccessTime[0]),
                        expiryTime: _this._date(times.ExpiryTime[0]),
                        expires: _this._boolean(times.Expires[0]),
                        usageCount: _this._number(times.UsageCount[0]),
                        locationChanged: _this._date(times.LocationChanged[0]),

                        isExpanded: _this._boolean(group.IsExpanded[0]),
                        lastTopVisibleEntry: _this._string(group.LastTopVisibleEntry[0])
                    };

                    // Entries
                    if(group.Entry) {
                        result[UUID].entries = parseEntries(group.Entry);
                    } else {
                        result[UUID].entries = {};
                    }

                    // Subgroups
                    if(group.Group) {
                        result[UUID].groups = parseGroups(group.Group);
                    } else {
                        result[UUID].groups = {};
                    }
                });

                return result;
            }

            d.groups = parseGroups(data.Root[0].Group);
            return d;
        },

        /**
         * Resets the Salsa20 stream cipher object
         * @private
         */
        _resetSalsa: function() {
            this._setSalsa(null);
            this._setSalsaBuffer([]);
        },

        /**
         * Unprotects a password with the Salsa20 stream cipher
         * @param {String} payload Base64 encoded salsa20 protected password
         * @return {String}
         * @private
         */
        _unprotect: function(payload) {
            var _this = this;

            /**
             * XORs a string with the given key, the length must be the same
             * @param {String} data Data which should be XORed
             * @param {Array} keyArray Key array which contains the XOR key
             * @return {String} XORed string
             */
            function xor(data, keyArray) {
                var result = '';
                for(var i = 0; i < data.length; ++i) {
                    result += String.fromCharCode(keyArray[i] ^ data.charCodeAt(i));
                }
                return result;
            }

            /**
             * Gets the next 'random' Salsa20 bytes from the stream cipher
             * @param {Number} length Length of Salsa20 bytes which should be read
             * @return {Array} Array with <length> bytes
             */
            function getSalsa(length) {
                var salsaBuffer = _this._getSalsaBuffer();

                // Grab new bytes if the buffer is not long enough
                var rlength = length;
                while(rlength > salsaBuffer.length) {
                    var newSalsa = _this._getSalsa().getBytes(64);
                    for(var i = 0; i < 64; i++) salsaBuffer.push(newSalsa[i]);
                }

                var result = salsaBuffer.slice(0, length);
                salsaBuffer.splice(0, length);
                return result;
            };

            // Initialize password and keys
            if(!payload) return '';
            var pw = new Buffer(payload, 'base64').toString('binary');
            var key = this._getHeader().get('ProtectedStreamKey').toString('binary');
            key = crypto.createHash('sha256').update(key, 'binary', 'binary').digest('binary');

            // Initialize salsa cipher if necessary
            if(!this._getSalsa()) {
                this._setSalsa(new Salsa20(
                    new Buffer(key, 'binary').toByteArray(),
                    SALSA_IV
                ));
            }

            // Return XORed password
            return xor(pw, getSalsa(pw.length));
        },

        /**
         * Checks if the payload is a number, if not
         * it will return -1
         * @param {*} payload Payload which should be checked
         * @return {Number}
         * @private
         */
        _number: function(payload) {
            if(!isFinite(payload) || isNaN(payload)) return -1;
            return +payload;
        },

        /**
         * Checks if the payload is a string, if not
         * it will return ''
         * @param {*} payload Payload which should be checked
         * @return {String}
         * @private
         */
        _string: function(payload) {
            if(typeof payload !== 'string') return '';
            return payload;
        },

        /**
         * Checks if the payload is a boolean, if not
         * it will return false
         * @param {*} payload Payload which should be checked
         * @return {Boolean}
         * @private
         */
        _boolean: function(payload) {
            return !!(payload == 'True');
        },

        /**
         * Checks if the payload is a date, if not
         * it will return -1
         * @param {*} payload Payload which should be checked
         * @return {Date}
         * @private
         */
        _date: function(payload) {
            var timestamp = Date.parse(payload);
            if(!isNaN(timestamp)) {
                return new Date(timestamp);
            } else {
                return -1;
            }
        }
    }
});
module.exports = KDB4Xml;