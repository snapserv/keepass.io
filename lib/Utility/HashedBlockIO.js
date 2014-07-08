'use strict';
var dejavu = require('dejavu');
var crypto = require('crypto');

var HashedBlockIO = dejavu.Class.declare({
	$name: 'HashedBlockIO',
	$constants: {
		HBIO_SPLIT_RATE: 16384
	},
	$statics: {
		decrypt: function(database) {
			if(!(database instanceof Buffer)) throw new Errors.Argument('Expected `database` to be a Buffer');

			// Process all HBIO blocks until there aren't any left
			var hbioBuffer = new Buffer(0);
			var currentOffset = 0;
			
			do {
				var blockIndex = database.readUInt32LE(currentOffset); currentOffset += 4;
				var blockHash = database.toString('hex', currentOffset, currentOffset + 32); currentOffset += 32;
				var blockLength = database.readUInt32LE(currentOffset); currentOffset += 4;

				if(blockLength > 0) {
					// Read block data and calculate SHA256 hash
					var blockData = database.slice(currentOffset, currentOffset + blockLength); currentOffset += blockLength;
					var calculatedHash = crypto.createHash('sha256').update(blockData).digest('hex');

					// Compare calculated with stored hash
					if(blockHash !== calculatedHash) {
						throw new Errors.Database('HBIO hash mismatch. The database seems to be corrupt.');
					} else {
						hbioBuffer = Buffer.concat([hbioBuffer, blockData]);
					}
				}
			} while(blockLength > 0);

			return hbioBuffer;
		},

		encrypt: function(database) {
			if(!(database instanceof Buffer)) throw new Errors.Argument('Expected `database` to be a Buffer');

			// Split data into multiple parts and generate HBIO metadata
			var hbioBuffer = new Buffer(0);
			var databaseSize = database.length;
			var currentOffset = 0, blockIndex = 0;

			while(databaseSize > 0) {
				// Calculate block length
				if(databaseSize > this.$static.HBIO_SPLIT_RATE) {
					var blockLength = this.$static.HBIO_SPLIT_RATE;
					databaseSize -= this.$static.HBIO_SPLIT_RATE;
				} else {
					var blockLength = databaseSize;
					databaseSize = 0;
				}

				// Calculate SHA256 hash of block
				var blockData = database.slice(currentOffset, currentOffset + blockLength);
				var blockHash = crypto.createHash('sha256').update(blockData).digest('hex');

				// Create new buffer for block and write its metadata
				var blockBuffer = new Buffer(4 + 32 + 4);
				blockBuffer.writeUInt32LE(blockIndex, 0);
				blockBuffer.write(blockHash, 4, 32, 'hex');
				blockBuffer.writeUInt32LE(blockLength, 36);

				// Add block metadata + the data itself to the HBIO buffer
				hbioBuffer = Buffer.concat([hbioBuffer, blockBuffer, blockData]);

				blockIndex++;
				currentOffset += blockLength;
			}

			// Create the HBIO end block
			var endBlockBuffer = new Buffer(40);
			endBlockBuffer.fill(0);
			endBlockBuffer.writeUInt32LE(blockIndex, 0);
			endBlockBuffer.writeUInt32LE(0, 36);

			// Add the end block to the chain
			hbioBuffer = Buffer.concat([hbioBuffer, endBlockBuffer]);
			return hbioBuffer;
		}
	}
});

module.exports = HashedBlockIO;