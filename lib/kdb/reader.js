// Module dependencies
var Class = require('classjs');

var IKDBReader = {
    readDatabase: function(cb) {
        // Check if credentials are present
        if(!this._getCredentials()) {
            throw new Error('You need to passover a valid credentials instance.');
        }

        // Set callback
        this._setCallback(cb);
    }
};
module.exports = IKDBReader;