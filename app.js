var keepassio = require('./lib');

var db = new keepassio();
db.setCredentials({
    password: '123456'
});
db.load('Test.kdbx', function(data) {

});