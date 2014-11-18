var path = require('path');
var kpio = require('../lib');

// Detect some needed paths
var resourcePath = path.join(__dirname, '..', 'test', 'resources');
var databasePath = path.join(resourcePath, '000_example.kdbx');
var newDatabasePath = path.join(__dirname, 'new-example.kdbx');
var keyfilePath = path.join(resourcePath, '000_example.key');

// Create a new database object, which can be used to load a database from a
// file on your harddisk. In future releases, this might be also used for creating
// a new database from scratch.
var db = new kpio.Database();

// Add all required credentials to the database object. It does not matter in which
// order you are adding the credentials, the library handles this for you. It would
// be possible to add multiple password or keyfile credentials, but no KeePass client
// supports that so far.
db.addCredential(new kpio.Credentials.Password('nebuchadnezzar'));
db.addCredential(new kpio.Credentials.Keyfile(keyfilePath));

// Tries to load the given file from your harddisk. It requires a callback function with
// the two parameters 'err' and 'api'. Before accessing 'api', you should always check if
// there was an error and if required, abort. 'api' however represents the KeePass.IO api
// object, which you can use to retrieve data from the database.
db.loadFile(databasePath, function(err) {
	if(err) throw err;

    // db.getRawApi() returns the raw API of keepass.io. By calling the method get(), we will
    // get the whole database object as JSON. Remember though that it isn't a reference, so any
    // changes you make to the object are lost. Please use set() to keep them.
	var rawDatabase = db.getRawApi().get();

	// This is just a short example, which will print the original database name and then
	// modify it to "KeePass.IO rocks!". To see all possible attributes, use JSON.stringify
	// on 'rawDatabase' and just mess around with all available values.
	console.log('Database name: ' + rawDatabase.KeePassFile.Meta.DatabaseName);
	rawDatabase.KeePassFile.Meta.DatabaseName = 'KeePass.IO rocks!';

	// This will drop all known credentials and start from scratch. By doing this, we can
	// actually encrypt the database with a new password called 'morpheus'. To simplify
	// testing purposes, we are using the same keyfile. This makes it possible to change
	// the master password of the database without any hassle.
	db.resetCredentials();
	db.addCredential(new kpio.Credentials.Password('morpheus'));
	db.addCredential(new kpio.Credentials.Keyfile(keyfilePath));

	// As mentioned above, this command is required as otherwise the changed data would not
	// be saved. Never forget that - or don't complain about lost data otherwise.
	db.getRawApi().set(rawDatabase);

	// This is going to save the current database state into the given file. Once again,
	// a callback function is required. Please always check 'err' within your callback function,
	// to avoid that your application continues if any fatal error occured.
	db.saveFile(newDatabasePath, function(err) {
		if(err) throw err;
	});
});