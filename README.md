keepass.io
==========

[![License](http://img.shields.io/badge/license-GPLv3-blue.svg)](https://github.com/NeoXiD/keepass.io/blob/master/LICENSE.md)
[![Build Status](http://img.shields.io/travis/NeoXiD/keepass.io/develop.svg)](http://travis-ci.org/NeoXiD/keepass.io)
[![Dependency Status](http://img.shields.io/david/NeoXiD/keepass.io.svg)](https://david-dm.org/NeoXiD/keepass.io)
[![Coverage Status](http://img.shields.io/coveralls/NeoXiD/keepass.io/develop.svg)](https://coveralls.io/r/NeoXiD/keepass.io?branch=develop)
[![NPM version](http://img.shields.io/npm/v/keepass.io.svg)](https://npmjs.org/package/keepass.io)
[![Gittip](http://img.shields.io/gittip/NeoXiD.svg)](https://www.gittip.com/NeoXiD)


*keepass.io* is a Node.js library for reading and writing KeePass databases. Please note that currently only the newest database version, called KDBX, is supported. Features include so far:

- **Password and/or Keyfile credentials**: keepass.io supports both of the most common used credential types for KeePass databases.
- **Powerful API**: This library offers you a powerful API, which even allows you raw access to the database, so even unsupported third-party fields can be modified.
- **Joyfully simple and flexible**: I've built keepass.io to be easily understandable and a joy to use. It's built with JavaScript and tries to provide a solid foundation for modifying KDBX databases.
- **Stunning performance**: To further improve performance, keepass.io even includes an optional native library, which will help while performing the key transformations. If your system should not have the *Crypto++ Dev Libraries* installed, it will automatically fallback to the slower Node.js methods.

-
**Note**: *keepass.io is currently under active development. As such, while this library is well-tested, the API might change at anytime. Consider using it in production applications only if you're comfortable following a changelog and updating your usage accordingly.*


Example
-------
As mentioned above, keepass.io is really easy to use. The following example code opens a database, outputs its name, changes the name to *'KeePass.IO rocks!'* and saves the database with new credentials. More examples are available within the *examples* folder.

```javascript
var path = require('path');
var kpio = require('../lib');

var db = new kpio.Database();
db.addCredential(new kpio.Credentials.Password('thematrix'));
db.addCredential(new kpio.Credentials.Keyfile('apoc.key'));
db.loadFile(databasePath, function(err) {
	if(err) throw err;

	var rawDatabase = db.getRawApi().get();
	console.log('Database name: ' + rawDatabase.KeePassFile.Meta.DatabaseName);
	rawDatabase.KeePassFile.Meta.DatabaseName = 'KeePass.IO rocks!';

	db.resetCredentials();
	db.addCredential(new kpio.Credentials.Password('morpheus'));
	db.addCredential(new kpio.Credentials.Keyfile('trinity.key'));

	db.getRawApi().set(rawDatabase);
	db.saveFile(newDatabasePath, function(err) {
		if(err) throw err;
	});
});
```


Copyright
---------
Copyright &copy; 2013-2014 Pascal Mathis. All rights reserved.