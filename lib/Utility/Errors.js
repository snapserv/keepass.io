function KpioGenericError(msg) {
	Error.call(this);
	Error.captureStackTrace(this, arguments.callee);
	this.name = 'KpioGenericError';
	this.message = msg;
}

function KpioArgumentError(msg) {
	Error.call(this);
	Error.captureStackTrace(this, arguments.callee);
	this.name = 'KpioArgumentError';
	this.message = msg;
}

function KpioDatabaseError(msg) {
	Error.call(this);
	Error.captureStackTrace(this, arguments.callee);
	this.name = 'KpioDatabaseError';
	this.message = msg;
}

KpioGenericError.prototype.__proto__ = Error.prototype;
KpioArgumentError.prototype.__proto__ = Error.prototype;
KpioDatabaseError.prototype.__proto__ = Error.prototype;

module.exports = {
	Generic: KpioGenericError,
	Argument: KpioArgumentError,
	Database: KpioDatabaseError
};