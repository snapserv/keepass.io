#include <iostream>
#include <node.h>
#include <node_buffer.h>
#include <v8.h>

#include <cryptopp/modes.h>
#include <cryptopp/aes.h>
#include <cryptopp/sha.h>
#include <cryptopp/hex.h>
#include <cryptopp/filters.h>

#define AES256_KEY_LENGTH 32
#define ROUND_UP_TO_MULTIPLE(numberToRound, multiple) ((numberToRound + multiple - 1) & ~(multiple - 1))

v8::Handle<v8::Value> kpion_transform_key(const v8::Arguments& args) {
	v8::HandleScope scope;

	// Check if the correct number of arguments was give
	if(args.Length() != 3) {
		v8::ThrowException(v8::Exception::TypeError(v8::String::New("Wrong number of arguments given.")));
		return scope.Close(v8::Undefined());
	}

	// Check if all the given arguments have their expected type
	if(!node::Buffer::HasInstance(args[0]) || !node::Buffer::HasInstance(args[1]) || !args[2]->IsNumber()) {
		v8::ThrowException(v8::Exception::TypeError(v8::String::New("One or more arguments have wrong types.")));
		return scope.Close(v8::Undefined());
	}

	// Store given arguments in variables
	int keyTransformationRounds = args[2]->NumberValue();
	int untransformedKeyLength = node::Buffer::Length(args[0]->ToObject());
	char *untransformedKey = node::Buffer::Data(args[0]->ToObject());
	char *unpaddedSeed = node::Buffer::Data(args[1]->ToObject());

	// Pad seed for AES cipher
	char paddedSeed[AES256_KEY_LENGTH];
	memset(paddedSeed, 0, AES256_KEY_LENGTH);
	memcpy(paddedSeed, unpaddedSeed, AES256_KEY_LENGTH);

	// Create Crypto++ cipher object
	CryptoPP::AES::Encryption cppAesEncryption((const byte *) paddedSeed, AES256_KEY_LENGTH);
	CryptoPP::ECB_Mode_ExternalCipher::Encryption cppEbcAesEncryptor(cppAesEncryption);

	// Create buffer for key transformation
	int transformedKeyLength = ROUND_UP_TO_MULTIPLE(untransformedKeyLength, CryptoPP::AES::BLOCKSIZE);
	int aesBlockCount = transformedKeyLength / CryptoPP::AES::BLOCKSIZE;
	char *transformedKey = (char *) malloc(transformedKeyLength);
	memset(transformedKey, 0, transformedKeyLength);
	memcpy(transformedKey, untransformedKey, untransformedKeyLength);

	// Transform the key for n rounds
	for(int round = 0; round < keyTransformationRounds; round++) {
		for(int block = 0; block < aesBlockCount; block++) {
			int offset = block * CryptoPP::AES::BLOCKSIZE;
			cppEbcAesEncryptor.ProcessData(
				(byte *) (transformedKey + offset),
				(const byte *) (transformedKey + offset),
				CryptoPP::AES::BLOCKSIZE
			);
		}
	}

	// Create SHA256 hash of transformed key
	CryptoPP::SHA256 sha256Hasher;
	byte sha256Digest[CryptoPP::SHA256::DIGESTSIZE];
	sha256Hasher.CalculateDigest(sha256Digest, (const byte *) transformedKey, untransformedKeyLength);

	// Convert SHA256 digest to hex encoding
	CryptoPP::HexEncoder hexEncoder(NULL, false);
	std::string hexSha256Hash;
	hexEncoder.Attach(new CryptoPP::StringSink(hexSha256Hash));
	hexEncoder.Put(sha256Digest, sizeof(sha256Digest));
	hexEncoder.MessageEnd();

	// Free unused buffers and return SHA256 hash
	free(transformedKey);
	return scope.Close(v8::String::New(hexSha256Hash.c_str(), hexSha256Hash.length()));
}

void init(v8::Handle<v8::Object> exports) {
	exports->Set(
		v8::String::NewSymbol("transformKey"),
		v8::FunctionTemplate::New(kpion_transform_key)->GetFunction()
	);
}

void Initialize(v8::Handle<v8::Object> exports);
NODE_MODULE(kpion, init)
