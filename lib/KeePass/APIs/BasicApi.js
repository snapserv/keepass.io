'use strict';
var dejavu = require('dejavu');
var Errors = require('../../Utility/Errors');
var BaseApi = require('./BaseApi');

var BasicApi = dejavu.Class.declare({
	$name: 'BasicApi',
	$extends: BaseApi
});

module.exports = BasicApi;