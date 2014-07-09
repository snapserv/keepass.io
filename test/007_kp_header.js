var should = require('should');
var crypto = require('crypto');
var helpers = require('./000_test_helpers');
var kpio = require('../lib');
var KeePassHeader = require('../lib/KeePass/KeePassHeader');

describe('Instantiating a new KeePassHeader with predefined fields', function() {
	var header = new KeePassHeader();		

	it('#declare() with no parameters should throw a KpioArgumentError', function() {
		(function() {
			header.declare();			
		}).should.throw(kpio.Errors.Argument);
	});

	it('#declare() with predefined fields should not throw any errors', function() {
		header.declare({
			fields: {
				'EndOfHeader': 0,
				'TestField': 1,
				'IntegerField': 2,
				'QuadField': 3,
				'ResolveTest': 4,
				'InvalidFormat': 5
			},
			formats: {
				2: 'INTEGER',
				3: 'QUAD',
				5: 'INVALID-FORMAT'
			}
		});
	});

	it('#getRaw() with an invalid field should throw a KpioDatabaseError', function() {
		(function() {
			header.getRaw('InexistantField');
		}).should.throw(kpio.Errors.Database);
	});

	describe('and calling #hasField()', function() {
		it('with 1 should return true', function() {
			header.hasField(1).should.be.true;
		});
		it('with `TestField` should return true', function() {
			header.hasField('TestField').should.be.true;
		});
		it('with -1 should return false', function() {
			header.hasField(-1).should.be.false;
		});
		it('with `InexistantField` should return false', function() {
			header.hasField('InexistantField').should.be.false;
		});
	});

	describe('and calling #resolveField()', function() {
		it('with 4 should return 4', function() {
			header.resolveField(3).should.equal(3);
		});

		it('with `ResolveTest` should return 4', function() {
			header.resolveField('ResolveTest').should.equal(4);
		});

		it('with -1 should throw a KpioDatabaseError', function() {
			(function() {
				header.resolveField(-1);
			}).should.throw(kpio.Errors.Database);
		});

		it('with `InexistantField` should throw a KpioDatabaseError', function() {
			(function() {
				header.resolveField('InexistantField');
			}).should.throw(kpio.Errors.Database);
		});
	});

	describe('and calling #get()', function() {
		it('with an invalid field should throw a KpioDatabaseError', function() {
			(function() {
				header.get('InexistantField');
			}).should.throw(kpio.Errors.Database);
		});

		it('on a field with an invalid format should throw a KpioDatabaseError', function() {
			(function() {
				header.get('InvalidFormat');
			}).should.throw(kpio.Errors.Database);
		});
	});

	describe('and calling #set()', function() {
		it('with an invalid type should throw a KpioArgumentError', function() {
			(function() {
				header.set('TestField', 'InvalidTypeTest');
			}).should.throw(kpio.Errors.Argument);
		});

		it('with an invalid field should throw a KpioDatabaseError', function() {
			(function() {
				header.set('InexistantField', new Buffer(0));
			}).should.throw(kpio.Errors.Database);
		});

		it('with a Buffer should not throw any errors', function() {
			(function() {
				var stringBuffer = new Buffer(11);
				var integerBuffer = new Buffer(4);
				var quadBuffer = new Buffer(8);

				stringBuffer.write('Test String');
				integerBuffer.writeUInt32LE(0xDEADBABE, 0);
				quadBuffer.writeUInt32LE(0xFFFFFFFF, 0);
				quadBuffer.writeUInt32LE(0xFFFFFFFF, 4);

				header.set('TestField', stringBuffer);
				header.set('IntegerField', integerBuffer);
				header.set('QuadField', quadBuffer);
			}).should.not.throw();
		});

		describe('and then querying `TestField`', function() {
			it('with #get() should return a Buffer', function() {
				var value = header.get('TestField');
				value.should.be.instanceof(Buffer);
			});

			it('with #getRaw() should return a Buffer', function() {
				var value = header.getRaw('TestField');
				value.should.be.instanceof(Buffer);
			});

			it('with #get() or #getRaw() should equal `Test String`', function() {
				header.get('TestField').toString().should.equal('Test String');
				header.getRaw('TestField').toString().should.equal('Test String');
			});
		});

		describe('and then querying `IntegerField`', function() {
			it('with #get() should return a specific number', function() {
				var value = header.get('IntegerField');
				value.should.be.type('number');
			});

			it('with #getRaw() should return a Buffer', function() {
				var value = header.getRaw('IntegerField');
				value.should.be.instanceof(Buffer);
			});

			it('with #get() should equal 3735927486', function() {
				var value = header.get('IntegerField');
				value.should.equal(3735927486);
			});
		});

		describe('and then querying `QuadField`', function() {
			it('with #get() should return a specific number', function() {
				var value = header.get('QuadField');
				value.should.be.type('number');
			});

			it('with #getRaw() should return a Buffer', function() {
				var value = header.getRaw('QuadField');
				value.should.be.instanceof(Buffer);
			});

			it('with #get() should equal 18446744073709552000', function() {
				var value = header.get('QuadField');
				value.should.equal(18446744073709552000);
			});
		});

		describe('and then calling #buildHeader()', function() {
			var rawHeader = null;

			it('with no parameters should throw a KpioArgumentError', function() {
				(function() {
					header.buildHeader();
				}).should.throw(kpio.Errors.Argument);
			});

			it('with a valid length should not throw any errors', function() {
				(function() {
					rawHeader = header.buildHeader(39);
				}).should.not.throw();
			});

			it('should match MD5 hash `63cd6050f7b4d5f2263671f408a46d2d`', function() {
				var hash = crypto.createHash('md5').update(rawHeader).digest('hex');
				hash.should.equal('63cd6050f7b4d5f2263671f408a46d2d');
			});
		});
	});
});