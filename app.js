var keepassio = require('./lib'),
    util = require('util');

var db = new keepassio();
db.setCredentials({
    password: '123456'
});
db.load('Test.kdbx', function(data) {
    console.log(util.inspect(data, false, 10, true));
});