var path = require('path');

exports.respath = function(resourceName) {
	return path.join(__dirname, 'resources', resourceName);
}