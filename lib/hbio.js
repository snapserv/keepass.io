// Module dependencies
var Class = require('classjs'),
    crypto = require('crypto');

var HashedBlockIO = Class.define({
    /**
     * Class properties
     */
    properties: {
        buffer: {
            type: "Object",
            init: null,
            nullable: true,
            set: false
        }
    },

    /**
     * Validates all the HBIO blocks
     * @param {Buffer} _buffer Buffer which should be validated
     */
    constructor: function(_buffer) {
        var buffer = new Buffer(_buffer.length);
        var offset = 0, roffset = 0;
        var index, length, hash, data, chash;

        // Validate all blocks
        do {
            index = _buffer.readUInt32LE(offset); offset += 4;
            hash = _buffer.toString('hex', offset, offset + 32); offset += 32;
            length = _buffer.readUInt32LE(offset); offset += 4;

            if(length > 0) {
                data = _buffer.toString('binary', offset, offset + length); offset += length;
                chash = crypto.createHash('sha256').update(data, 'binary', 'hex').digest('hex');

                // Are the hashes the same?
                if(hash != chash) {
                    throw new Error('Block hash mismatch error.');
                } else {
                    buffer.write(data, roffset, length, 'binary');
                    roffset += length;
                }
            }
        } while(length != 0);

        this._setBuffer(buffer);
    }
});
module.exports = HashedBlockIO;