function KpioGenericError(msg) {
	Error.call(this);
	Error.captureStackTrace(this, arguments.callee);
	this.name = 'KpioGenericError';
	this.message = msg;
}

KpioGenericError.prototype.__proto__ = Error.prototype;

module.exports = {
	Generic: KpioGenericError
};