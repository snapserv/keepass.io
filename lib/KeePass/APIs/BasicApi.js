'use strict';
var dejavu = require('dejavu');
var Errors = require('../../Utility/Errors');
var BaseApi = require('./BaseApi');

var BasicApi = dejavu.Class.declare({
	$name: 'BasicApi',
	$extends: BaseApi,

	__groupTree: null,
	__groupEntries: null,

	getGroupTree: function() {
		if(this.$isDirty()) this.__disassemble();
		return JSON.parse(JSON.stringify(this.__groupTree));
	},

	setGroupTree: function(groupTree) {
		this.__assemble(groupTree);
	},

	__assemble: function(groupTree) {
		function recursiveWalker(parentObject, entryList) {
			var groupList = [];

			parentObject.forEach(function(groupObject) {
				groupObject = JSON.parse(JSON.stringify(groupObject));
				if(groupObject.Groups) groupObject.Group = recursiveWalker(groupObject.Groups, entryList);
				if(entryList[groupObject.UUID]) groupObject.Entry = entryList[groupObject.UUID];
				delete groupObject.Groups;
				groupList.push(groupObject);
			});

			return groupList;
		}

		this._database.KeePassFile.Root.Group = recursiveWalker(groupTree, this.__groupEntries);
		this.$storeDatabase(this._database);
	},

	__disassemble: function() {
		function recursiveWalker(parentObject, entryList) {
			if(!Array.isArray(parentObject)) parentObject = [parentObject];
			if(!entryList) entryList = {};
			var groupList = [];

			parentObject.forEach(function(groupObject) {
				groupObject = JSON.parse(JSON.stringify(groupObject));
				if(groupObject.Group) groupObject.Groups = recursiveWalker(groupObject.Group, entryList)[0];
				if(groupObject.Entry) entryList[groupObject.UUID] = groupObject.Entry;
				delete groupObject.Group;
				delete groupObject.Entry;
				groupList.push(groupObject);
			}.$bind(this));

			return [groupList, entryList];
		}

		var results = recursiveWalker(this._database.KeePassFile.Root.Group);
		this.__groupTree = results[0];
		this.__groupEntries = results[1];
	}
});

module.exports = BasicApi;