# keepass.io #

[![build status](https://secure.travis-ci.org/NeoXiD/keepass.io.png)](http://travis-ci.org/NeoXiD/keepass.io)

keepass.io is a simple KeePass database reader written in NodeJS.

## License ##
GPL version 3. Please take a look into LICENSE if you want to know more.

## Prerequisites ##
keepass.io requires version 0.8.x of Node.js or higher. If you want to run the tests or work on keepass.io, you'll want [Mocha](https://github.com/visionmedia/mocha) and [should.js](https://github.com/visionmedia/should.js/).

## Installing with [NPM](http://npmjs.org) ##

```
npm install keepass.io
```

## Loading a database ##
Loading a database in keepass.io is kinda simple:

```javascript
var keepassio = require('keepass.io');
var db = new keepassio();

db.setCredentials({
	password: '1234',
	keyfile: 'my.key'
});

db.load('database.kdbx', function(error, data) {
	if(error) throw error;
	console.log(data);
});
```

Thats it. If your database does not have a keyfile, you can just omit the *keyfile* key when calling *setCredentials*. If the loading was successful, *data* will be an object with all the meta data, groups and entries in it.

### test.kdbx data, formatted as JSON ###
```json
{
    "meta": {
        "generator": "KeePass",
        "dbName": "Test Name",
        "dbNameChanged": "2013-03-02T19:43:39.000Z",
        "dbDescription": "Test Description",
        "dbDescriptionChanged": "2013-03-02T19:43:39.000Z",
        "defaultUser": "",
        "defaultUserChanged": "2013-03-02T19:43:09.000Z",
        "maintenanceHistoryDays": 365,
        "masterKeyChanged": "2013-03-02T19:43:09.000Z",
        "masterKeyChangeRec": -1,
        "masterKeyChangeForce": -1,
        "recycleBinEnabled": false,
        "recycleBinUUID": "AAAAAAAAAAAAAAAAAAAAAA==",
        "recycleBinChanged": "2013-03-02T19:43:39.000Z",
        "entryTemplatesGroup": "AAAAAAAAAAAAAAAAAAAAAA==",
        "entryTemplatesGroupChanged": "2013-03-02T19:43:09.000Z",
        "historyMaxItems": 10,
        "historyMaxSize": 6291456,
        "lastSelectedGroup": "Tey6uDYSQUCUpzBsHbrshw==",
        "lastTopVisibleGroup": "Tey6uDYSQUCUpzBsHbrshw=="
    },
    "groups": {
        "Tey6uDYSQUCUpzBsHbrshw==": {
            "name": "Test",
            "notes": "",
            "iconID": 49,
            "lastModificationTime": "2013-03-02T19:43:09.000Z",
            "creationTime": "2013-03-02T19:43:09.000Z",
            "lastAccessTime": "2013-03-02T19:43:45.000Z",
            "expiryTime": "2013-03-02T12:15:48.000Z",
            "expires": false,
            "usageCount": 6,
            "locationChanged": "2013-03-02T19:43:09.000Z",
            "isExpanded": true,
            "lastTopVisibleEntry": "wGtcsTfSoEadz/fqbTy8Bg==",
            "entries": {
                "TGCQ5xfOoUCV+yLGGCxM8g==": {
                    "title": "keepass.io",
                    "url": "",
                    "username": "will-it-work?",
                    "notes": "",
                    "lastModificationTime": "2013-03-02T19:44:12.000Z",
                    "creationTime": "2013-03-02T19:43:48.000Z",
                    "lastAccessTime": "2013-03-02T19:44:12.000Z",
                    "expiryTime": "2013-03-02T12:15:48.000Z",
                    "expires": false,
                    "usageCount": 1,
                    "locationChanged": "2013-03-02T19:43:48.000Z",
                    "iconID": 0,
                    "password": "yesitwill"
                },
                "wGtcsTfSoEadz/fqbTy8Bg==": {
                    "title": "agent",
                    "url": "",
                    "username": "smith",
                    "notes": "",
                    "lastModificationTime": "2013-03-02T19:44:34.000Z",
                    "creationTime": "2013-03-02T19:44:14.000Z",
                    "lastAccessTime": "2013-03-02T19:44:34.000Z",
                    "expiryTime": "2013-03-02T12:15:48.000Z",
                    "expires": false,
                    "usageCount": 1,
                    "locationChanged": "2013-03-02T19:44:14.000Z",
                    "iconID": 0,
                    "password": "matrixtest"
                }
            },
            "groups": {}
        }
    }
}
```

- - -
keepass.io KeePass database reader - © 2012-2013 P. Mathis (dev@snapserv.net)
