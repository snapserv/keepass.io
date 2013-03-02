var util = require('util');

var AbstractError = function(msg, constructor) {
    Error.captureStackTrace(this, constructor || this);
    this.message = msg || 'Error';
};
util.inherits(AbstractError, Error);
AbstractError.prototype.name = 'AbstractError';

var CredentialsError = function(msg) {
    CredentialsError.super_.call(this, msg, this.constructor);
};
util.inherits(CredentialsError, AbstractError);
CredentialsError.prototype.name = 'CredentialsError';

var IOError = function(msg) {
    IOError.super_.call(this, msg, this.constructor);
};
util.inherits(IOError, AbstractError);
IOError.prototype.name = 'IOError';

var DatabaseError = function(msg) {
    DatabaseError.super_.call(this, msg, this.constructor);
};
util.inherits(DatabaseError, AbstractError);
DatabaseError.prototype.name = 'DatabaseError';

module.exports = {
    Credentials: CredentialsError,
    IO: IOError,
    Database: DatabaseError
};