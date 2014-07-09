'use strict';

module.exports = {
	Database: require('./Database'),
	Errors: require('./Utility/Errors'),
	Credentials: {
		Password: require('./Credentials/PasswordCredential'),
		Keyfile: require('./Credentials/KeyfileCredential')
	},
	Interfaces: {
		Credential: require('./Interfaces/CredentialInterface')
	}
};