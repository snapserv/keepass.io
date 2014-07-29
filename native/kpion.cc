/* System includes */
#include <iostream>

/* Node.js includes */
#include <node.h>
#include <node_buffer.h>
#include <v8.h>
#include "nan.h"

/* Crypto++ includes */
#include <cryptopp/modes.h>
#include <cryptopp/aes.h>
#include <cryptopp/sha.h>
#include <cryptopp/hex.h>
#include <cryptopp/filters.h>

/* Constants & Macros */
#define AES256_KEY_LENGTH 32
#define ROUND_UP_TO_MULTIPLE(numberToRound, multiple) \
	((numberToRound + multiple - 1) & ~(multiple - 1))

/* Structures */
struct String {
	char *value;
	size_t length;
};

NAN_METHOD(kpion_transform_key) {
	NanScope();

	// Check if the corrent number of arguments was given
	if(args.Length() != 3) {
		return NanThrowTypeError("Wrong number of arguments given.");
	}

	// Check if all the given arguments have their expected type
	if(!node::Buffer::HasInstance(args[0]) || !node::Buffer::HasInstance(args[1]) || !args[2]->IsNumber()) {
		return NanThrowTypeError("One or more arguments have wrong types.");
	}

	// Convert Node.js arguments to C variables
	int keyTransformationRounds = args[2]->NumberValue();
	struct String untransformedKey;
	struct String unpaddedSeed;

	untransformedKey.value = node::Buffer::Data(args[0]->ToObject());
	untransformedKey.length = node::Buffer::Length(args[0]->ToObject());
	unpaddedSeed.value = node::Buffer::Data(args[1]->ToObject());
	unpaddedSeed.length = node::Buffer::Length(args[1]->ToObject());

	// Pad seed / key for AES256 cipher (32 bytes)
	struct String paddedSeed;
	paddedSeed.length = AES256_KEY_LENGTH;
	paddedSeed.value = (char *) malloc(AES256_KEY_LENGTH);
	memset(paddedSeed.value, 0, paddedSeed.length);
	memcpy(paddedSeed.value, unpaddedSeed.value, paddedSeed.length);

	// Create Crypto++ cipher object
	CryptoPP::AES::Encryption cppAesEncryption((const byte *) paddedSeed.value, AES256_KEY_LENGTH);
	CryptoPP::ECB_Mode_ExternalCipher::Encryption cppEbcAesEncryptor(cppAesEncryption);

	// Create buffer for key transformations
	struct String transformedKey;
	transformedKey.length = ROUND_UP_TO_MULTIPLE(untransformedKey.length, CryptoPP::AES::BLOCKSIZE);
	transformedKey.value = (char *) malloc(transformedKey.length);
	memset(transformedKey.value, 0, transformedKey.length);
	memcpy(transformedKey.value, untransformedKey.value, transformedKey.length);

	// Calculate amount of AES blocks
	int aesBlockCount = transformedKey.length / CryptoPP::AES::BLOCKSIZE;

	// Transform the key for n rounds
	for(; keyTransformationRounds > 0; keyTransformationRounds--) {
		for(int block = 0; block < aesBlockCount; block++) {
			size_t currentOffset = block * CryptoPP::AES::BLOCKSIZE;
			cppEbcAesEncryptor.ProcessData(
				(byte *) (transformedKey.value + currentOffset),
				(const byte *) (transformedKey.value + currentOffset),
				CryptoPP::AES::BLOCKSIZE
			);
		}
	}

	// Create SHA256 hash of transformed key
	CryptoPP::SHA256 sha256Hasher;
	byte sha256Digest[CryptoPP::SHA256::DIGESTSIZE];
	sha256Hasher.CalculateDigest(sha256Digest, (const byte *) transformedKey.value, untransformedKey.length);

	// Convert SHA256 digest to hex encoding
	CryptoPP::HexEncoder hexEncoder(NULL, false);
	std::string hexSha256Hash;
	hexEncoder.Attach(new CryptoPP::StringSink(hexSha256Hash));
	hexEncoder.Put(sha256Digest, sizeof(sha256Digest));
	hexEncoder.MessageEnd();

	// Free unused buffers
	free(paddedSeed.value);
	free(transformedKey.value);

	NanReturnValue(NanNew<v8::String>(hexSha256Hash.c_str()));
}

void InitAll(v8::Handle<v8::Object> exports) {
	exports->Set(
		NanNew<v8::String>("transformKey"),
		NanNew<v8::FunctionTemplate>(kpion_transform_key)->GetFunction()
	);
}

NODE_MODULE(kpion, InitAll);