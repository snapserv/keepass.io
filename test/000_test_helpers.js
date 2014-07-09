var path = require('path');

exports.respath = function(resourceName) {
	return path.join(__dirname, 'resources', resourceName);
};

exports.tmppath = function(fileName) {
	return path.join(__dirname, 'temp', fileName);
};