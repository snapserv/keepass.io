'use strict';
var dejavu = require('dejavu');
var Errors = require('./Errors');

var Salsa20 = dejavu.Class.declare({
	$name: 'Salsa20',
	$statics: {
		ROUNDS: 20,
		SIGMA_WORDS: [0x61707865, 0x3320646E, 0x79622D32, 0x6B206574]
	},
	
	// State variables
	keyWords: [],
	nonceWords: [0, 0],
	counterWords: [0, 0],
	
	// Output buffer
	block: [],
	blockUsed: 64,
	
	/**
	 * Constructs a new stream cipher instance with
	 * the given key and nonce.
	 * 
	 * @param {array} key Byte array containing the key
	 * @param {array} nonce Byte array containing the nonce
	 * 
	 * @returns {object} Stream cipher instance
	 */
	initialize: function initialize(key, nonce) {
		if(typeof key !== 'string' && !Array.isArray(key) && !(key instanceof Buffer)) {
			throw new Errors.Argument('Expected `key` to be a String, Array or Buffer');
		}
		if(typeof nonce !== 'string' && !Array.isArray(nonce) && !(nonce instanceof Buffer)) {
			throw new Errors.Argument('Expected `nonce` to be a String, Array or Buffer');
		}

		this.setKey(key);
		this.setNonce(nonce);
	},
	
	/**
	 * Sets the key for the Salsa20 stream cipher instance.
	 * This function resets the stream cipher and will
	 * therefore have immediate effect.
	 * 
	 * @param {array} key Byte array containing the key
	 */
	setKey: function setKey(key) {
		if(typeof key !== 'string' && !Array.isArray(key) && !(key instanceof Buffer)) {
			throw new Errors.Argument('Expected `key` to be a String, Array or Buffer');
		}

		for(var i = 0, j = 0; i < 8; i++, j += 4) {
			this.keyWords[i] =
				((key[j+0] & 0xFF) <<  0) |
				((key[j+1] & 0xFF) <<  8) |
				((key[j+2] & 0xFF) << 16) |
				((key[j+3] & 0xFF) << 24);
		}
		
		this.__reset();
	},
	
	/**
	 * Sets the nonce / initialization vector for the
	 * stream cipher instance. As with setKey(), this function
	 * resets the stream cipher and will have an immediate
	 * effect.
	 * 
	 * @param {array} key Byte array containing the nonce
	 */
	setNonce: function setNonce(nonce) {
		if(typeof nonce !== 'string' && !Array.isArray(nonce) && !(nonce instanceof Buffer)) {
			throw new Errors.Argument('Expected `nonce` to be a String, Array or Buffer');
		}

		this.nonceWords[0] =
			((nonce[0] & 0xFF) <<  0) |
			((nonce[1] & 0xFF) <<  8) |
			((nonce[2] & 0xFF) << 16) |
			((nonce[3] & 0xFF) << 24);
		this.nonceWords[1] =
			((nonce[4] & 0xFF) <<  0) |
			((nonce[5] & 0xFF) <<  8) |
			((nonce[6] & 0xFF) << 16) |
			((nonce[7] & 0xFF) << 24);
		
		this.__reset();
	},
	
	/**
	 * Gets a specific amount of bytes from the Salsa20 stream cipher. This method takes care
	 * of chunking the cipher outputs, so you can actually request blocks bigger than 64 bytes.
	 * 
	 * @param {number} numberOfBytes The number of bytes you wish
	 * 
	 * @return {Array} Array containing the bytes from the stream cipher
	 */
	getBytes: function getBytes(numberOfBytes) {
		if(typeof numberOfBytes !== 'number') throw new Errors.Argument('Expected `numberOfBytes` to be a Number');

		var result = new Array(numberOfBytes);
		for(var i = 0; i < numberOfBytes; i++) {
			if(this.blockUsed == 64) {
				this.__generateBlock();
				this.__incrementCounter();
				this.blockUsed = 0;
			}
			
			result[i] = this.block[this.blockUsed];
			this.blockUsed++;
		}
		
		return result;
	},
	
	/**
	 * Gets a specific amount of bytes from the Salsa20 stream cipher and returns them as
	 * a hex string. Because this method internally uses getBytes(), you can request blocks
	 * bigger than 64 bytes.
	 * 
	 * @param {number} numberOfBytes The number of bytes you wish
	 * 
	 * @returns {string} Hexadecimal string containing the bytes from the stream cipher
	 */
	getHexString: function getHexString(numberOfBytes) {
		if(typeof numberOfBytes !== 'number') throw new Errors.Argument('Expected `numberOfBytes` to be a Number');
		
		var hex = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
		var result = [];
		var bytes = this.getBytes(numberOfBytes);
		
		for(var i = 0; i < bytes.length; i++) {
			result.push(hex[(bytes[i] >> 4) & 0xF]);
			result.push(hex[bytes[i] & 0xF]);
		}
		return result.join('');
	},
	
	/**
	 * Resets the stream cipher. After this was function was called,
	 * the stream cipher starts again at the beginning. Note that this
	 * function does not remove the key or nonce, they will be still valid.
	 * 
	 * This method should be called whenever some setting changes, like
	 * the amount of rounds, the nonce or the key.
	 */
	__reset: function __reset() {
		this.counterWords[0] = 0;
		this.counterWords[1] = 0;
		this.blockUsed = 64;
	},
	
	/**
	 * Increments the internal Salsa20 counter so the next block of
	 * bytes can be retrieved from the stream cipher.
	 */
	__incrementCounter: function __incrementCounter() {
		this.counterWords[0] = (this.counterWords[0] + 1) & 0xFFFFFFFF;
		if(this.counterWords[0] === 0) {
			this.counterWords[1] = (this.counterWords[1] + 1) & 0xFFFFFFFF;
		}
	},
	
	/**
	 * Generates the next Salsa20 block containing 64 bytes. This method
	 * gets called whenever the current buffer has not enough bytes and
	 * new data is needed. This method does not increase the counter by
	 * itself, this has to be done by the calling method.
	 */
	__generateBlock: function __generateBlock() {
		var u;
		var j0 = this.$static.SIGMA_WORDS[0],
			j1 = this.keyWords[0],
			j2 = this.keyWords[1],
			j3 = this.keyWords[2],
			j4 = this.keyWords[3],
			j5 = this.$static.SIGMA_WORDS[1],
			j6 = this.nonceWords[0],
			j7 = this.nonceWords[1],
			j8 = this.counterWords[0],
			j9 = this.counterWords[1],
			j10 = this.$static.SIGMA_WORDS[2],
			j11 = this.keyWords[4],
			j12 = this.keyWords[5],
			j13 = this.keyWords[6],
			j14 = this.keyWords[7],
			j15 = this.$static.SIGMA_WORDS[3];
		var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7, x8 = j8, x9 = j9,
			x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14, x15 = j15;
			
		for(var i = 0; i < this.$static.ROUNDS; i += 2) {
			// First block
			u = x0 + x12;
			x4 ^= (u << 7) | (u >>> (32 - 7));
			u = x4 + x0;
			x8 ^= (u << 9) | (u >>> (32 - 9));
			u = x8 + x4;
			x12 ^= (u << 13) | (u >>> (32 - 13));
			u = x12 + x8;
			x0 ^= (u << 18) | (u >>> (32 - 18));
			
			// Second block
			u = x5 + x1;
			x9 ^= (u << 7) | (u >>> (32 - 7));
			u = x9 + x5;
			x13 ^= (u << 9) | (u >>> (32 - 9));
			u = x13 + x9;
			x1 ^= (u << 13) | (u >>> (32 - 13));
			u = x1 + x13;
			x5 ^= (u << 18) | (u >>> (32 - 18));
			
			// Third block
			u = x10 + x6;
			x14 ^= (u << 7) | (u >>> (32 - 7));
			u = x14 + x10;
			x2 ^= (u << 9) | (u >>> (32 - 9));
			u = x2 + x14;
			x6 ^= (u << 13) | (u >>> (32 - 13));
			u = x6 + x2;
			x10 ^= (u << 18) | (u >>> (32 - 18));
			
			// Fourth block
			u = x15 + x11;
			x3 ^= (u << 7) | (u >>> (32 - 7));
			u = x3 + x15;
			x7 ^= (u << 9) | (u >>> (32 - 9));
			u = x7 + x3;
			x11 ^= (u << 13) | (u >>> (32 - 13));
			u = x11 + x7;
			x15 ^= (u << 18) | (u >>> (32 - 18));
			
			// Fifth block
			u = x0 + x3;
			x1 ^= (u << 7) | (u >>> (32 - 7));
			u = x1 + x0;
			x2 ^= (u << 9) | (u >>> (32 - 9));
			u = x2 + x1;
			x3 ^= (u << 13) | (u >>> (32 - 13));
			u = x3 + x2;
			x0 ^= (u << 18) | (u >>> (32 - 18));
			
			// Sixth block
			u = x5 + x4;
			x6 ^= (u << 7) | (u >>> (32 - 7));
			u = x6 + x5;
			x7 ^= (u << 9) | (u >>> (32 - 9));
			u = x7 + x6;
			x4 ^= (u << 13) | (u >>> (32 - 13));
			u = x4 + x7;
			x5 ^= (u << 18) | (u >>> (32 - 18));
			
			// Seventh block
			u = x10 + x9;
			x11 ^= (u << 7) | (u >>> (32 - 7));
			u = x11 + x10;
			x8 ^= (u << 9) | (u >>> (32 - 9));
			u = x8 + x11;
			x9 ^= (u << 13) | (u >>> (32 - 13));
			u = x9 + x8;
			x10 ^= (u << 18) | (u >>> (32 - 18));
			
			// Eight block
			u = x15 + x14;
			x12 ^= (u << 7) | (u >>> (32 - 7));
			u = x12 + x15;
			x13 ^= (u << 9) | (u >>> (32 - 9));
			u = x13 + x12;
			x14 ^= (u << 13) | (u >>> (32 - 13));
			u = x14 + x13;
			x15 ^= (u << 18) | (u >>> (32 - 18));
		}
		
		x0 += j0; x1 += j1; x2 += j2; x3 += j3;
		x4 += j4; x5 += j5; x6 += j6; x7 += j7;
		x8 += j8; x9 += j9; x10 += j10; x11 += j11;
		x12 += j12; x13 += j13; x14 += j14; x15 += j15;
		
		this.block[0] = (x0 >>> 0) & 0xFF; this.block[1] = (x0 >>> 8) & 0xFF; this.block[2] = (x0 >>> 16) & 0xFF; this.block[3] = (x0 >>> 24) & 0xFF;
		this.block[4] = (x1 >>> 0) & 0xFF; this.block[5] = (x1 >>> 8) & 0xFF; this.block[6] = (x1 >>> 16) & 0xFF; this.block[7] = (x1 >>> 24) & 0xFF;
		this.block[8] = (x2 >>> 0) & 0xFF; this.block[9] = (x2 >>> 8) & 0xFF; this.block[10] = (x2 >>> 16) & 0xFF; this.block[11] = (x2 >>> 24) & 0xFF;
		this.block[12] = (x3 >>> 0) & 0xFF; this.block[13] = (x3 >>> 8) & 0xFF; this.block[14] = (x3 >>> 16) & 0xFF; this.block[15] = (x3 >>> 24) & 0xFF;
		this.block[16] = (x4 >>> 0) & 0xFF; this.block[17] = (x4 >>> 8) & 0xFF; this.block[18] = (x4 >>> 16) & 0xFF; this.block[19] = (x4 >>> 24) & 0xFF;
		this.block[20] = (x5 >>> 0) & 0xFF; this.block[21] = (x5 >>> 8) & 0xFF; this.block[22] = (x5 >>> 16) & 0xFF; this.block[23] = (x5 >>> 24) & 0xFF;
		this.block[24] = (x6 >>> 0) & 0xFF; this.block[25] = (x6 >>> 8) & 0xFF; this.block[26] = (x6 >>> 16) & 0xFF; this.block[27] = (x6 >>> 24) & 0xFF;
		this.block[28] = (x7 >>> 0) & 0xFF; this.block[29] = (x7 >>> 8) & 0xFF; this.block[30] = (x7 >>> 16) & 0xFF; this.block[31] = (x7 >>> 24) & 0xFF;
		this.block[32] = (x8 >>> 0) & 0xFF; this.block[33] = (x8 >>> 8) & 0xFF; this.block[34] = (x8 >>> 16) & 0xFF; this.block[35] = (x8 >>> 24) & 0xFF;
		this.block[36] = (x9 >>> 0) & 0xFF; this.block[37] = (x9 >>> 8) & 0xFF; this.block[38] = (x9 >>> 16) & 0xFF; this.block[39] = (x9 >>> 24) & 0xFF;
		this.block[40] = (x10 >>> 0) & 0xFF; this.block[41] = (x10 >>> 8) & 0xFF; this.block[42] = (x10 >>> 16) & 0xFF; this.block[43] = (x10 >>> 24) & 0xFF;
		this.block[44] = (x11 >>> 0) & 0xFF; this.block[45] = (x11 >>> 8) & 0xFF; this.block[46] = (x11 >>> 16) & 0xFF; this.block[47] = (x11 >>> 24) & 0xFF;
		this.block[48] = (x12 >>> 0) & 0xFF; this.block[49] = (x12 >>> 8) & 0xFF; this.block[50] = (x12 >>> 16) & 0xFF; this.block[51] = (x12 >>> 24) & 0xFF;
		this.block[52] = (x13 >>> 0) & 0xFF; this.block[53] = (x13 >>> 8) & 0xFF; this.block[54] = (x13 >>> 16) & 0xFF; this.block[55] = (x13 >>> 24) & 0xFF;
		this.block[56] = (x14 >>> 0) & 0xFF; this.block[57] = (x14 >>> 8) & 0xFF; this.block[58] = (x14 >>> 16) & 0xFF; this.block[59] = (x14 >>> 24) & 0xFF;
		this.block[60] = (x15 >>> 0) & 0xFF; this.block[61] = (x15 >>> 8) & 0xFF; this.block[62] = (x15 >>> 16) & 0xFF; this.block[63] = (x15 >>> 24) & 0xFF;
	}
});

module.exports = Salsa20;