// Module dependencies
var crypto = require('crypto'),
    jspack = require('jspack').jspack;

/**
 * Unpacks a buffer with jspack
 * @param {Buffer} buffer Buffer which should be unpacked
 * @param {Number} offset Offset in bytes
 * @param {Number} length Length in bytes
 * @param {String} type Pack type (see README of jspack)
 * @return {*}
 */
var unpackBuffer = function(buffer, offset, length, type) {
    if(!type) type = 'I';
    var data = buffer.slice(offset, offset + length);
    return jspack.Unpack('<' + type, data, 0)[0];
};

/**
 * Reads the database signatures (2x 4 bytes) from the
 * buffer and returns them
 * @param {Buffer} buffer Bits 0-8 will be read
 * @return {Array} Array which contains both signatures
 */
var readSignature = function(buffer) {
    var sig1 = unpackBuffer(buffer, 0, 4);
    var sig2 = unpackBuffer(buffer, 4, 4);
    return [sig1, sig2];
};

/**
 * Transforms a specified key n rounds
 * @param {String} key Key which should be transformed
 * @param {Buffer} Transformation seed
 * @param {Number} rounds Transformation rounds
 */
var transformKey = function(key, seed, rounds) {
    for(var round = 0; round < rounds; round++) {
        var cipher = crypto.createCipheriv('aes-256-ecb', seed, new Buffer(0));
        cipher.setAutoPadding(false);
        key = cipher.update(key, 'binary', 'binary') + cipher.final('binary');
    }

    key = crypto.createHash('sha256').update(key, 'binary').digest('binary');
    return key;
}

// Exports
exports.unpackBuffer = unpackBuffer;
exports.readSignature = readSignature;
exports.transformKey = transformKey;