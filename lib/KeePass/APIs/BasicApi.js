'use strict';
var dejavu = require('dejavu');
var Errors = require('../../Utility/Errors');
var BaseApi = require('./BaseApi');

var BasicApi = dejavu.Class.declare({
	$name: 'BasicApi',
	$extends: BaseApi,

	__groupTree: null,
	__groupEntries: {},

	getGroupTree: function() {
		if(this.$isDirty()) this.__disassemble();
		return JSON.parse(JSON.stringify(this.__groupTree));
	},

	setGroupTree: function(groupTree) {
		this.__groupTree = groupTree;
		this.__assemble();
	},

	getGroup: function(groupUuid) {
		if(this.$isDirty()) this.__disassemble();
		if(typeof groupUuid !== 'string') throw new Errors.Api('Expected `groupUuid` to be a string');

		var group = this.__findGroup(groupUuid);
		if(!group) throw new Errors.Api('Could not find group with given UUID: ' + groupUuid);
		return JSON.parse(JSON.stringify(group));
	},

	setGroup: function(groupUuid, groupData) {
		if(typeof groupUuid !== 'string') throw new Errors.Api('Expected `groupUuid` to be a string');
		if(typeof groupData !== 'object') throw new Errors.Api('Expected `groupData` to be a object');

		// First, search for the parent group containing the desired group
		var parentGroup = this.__findGroup(groupUuid, true);
		if(!parentGroup) throw new Errors.Api('Could not find group with given UUID: ' + groupUuid);
		
		// Second, search for the array index of the group and replace it
		for(var key in parentGroup) {
			if(parentGroup[key].UUID === groupUuid) {
				parentGroup[key] = JSON.parse(JSON.stringify(groupData));
				this.__assemble();
				return;
			}
		}
	},

	getEntries: function(groupUuid) {
		if(this.$isDirty()) this.__disassemble();
		if(typeof groupUuid !== 'string') throw new Errors.Api('Expected `groupUuid` to be a string');
		if(!this.__groupEntries[groupUuid]) throw new Errors.Api('Could not find group with given UUID: ' + groupUuid);

		return this.__groupEntries[groupUuid];
	},

	setEntries: function(groupUuid, entryList, ignoreInexistantUuid) {
		if(typeof groupUuid !== 'string') throw new Errors.Api('Expected `groupUuid` to be a string');
		if(!Array.isArray(entryList)) throw new Errors.Api('Expected `entryList` to be an array');
		if(!ignoreInexistantUuid) {
			if(!this.__findGroup(groupUuid)) throw new Errors.Api('Could not find group with given UUID: ' + groupUuid);
		}

		this.__groupEntries[groupUuid] = entryList;
		this.__assemble();
	},

	findOrphanedEntries: function() {
		if(this.$isDirty()) this.__disassemble();
		var orphanedEntries = {};

		for(var groupUuid in this.__groupEntries) {
			if(this.__findGroup(groupUuid)) continue;
			orphanedEntries[groupUuid] = JSON.parse(JSON.stringify(this.__groupEntries[groupUuid]));
		}

		return orphanedEntries;
	},

	deleteOrphanedEntries: function() {
		if(this.$isDirty()) this.__disassemble();

		for(var groupUuid in this.__groupEntries) {
			if(this.__findGroup(groupUuid)) continue;
			delete this.__groupEntries[groupUuid];
		}
	},

	__findGroup: function(groupUuid, returnParent) {
		function recursiveSearcher(parentObject, groupUuid, returnParent) {
			for(var key in parentObject) {
				var groupObject = parentObject[key];
				if(groupObject.UUID === groupUuid) {
					if(returnParent) return parentObject;
					else return groupObject;
				}
				if(groupObject.Groups) {
					var result = recursiveSearcher(groupObject.Groups, groupUuid, returnParent);
					if(result) return result;
				}
			}
			return null;
		}

		return recursiveSearcher(this.__groupTree, groupUuid, returnParent);
	},

	__assemble: function(groupTree, groupEntries) {
		function recursiveWalker(parentObject, entryList) {
			var groupList = [];

			parentObject.forEach(function(groupObject) {
				if(groupObject !== Object(groupObject)) return;

				// Clone object so original won't be touched
				groupObject = JSON.parse(JSON.stringify(groupObject));

				// Recursively parse through all groups, so that child groups are also included
				if(groupObject.Groups) {
					groupObject.Group = recursiveWalker(groupObject.Groups, entryList);
					delete groupObject.Groups;	
				}

				// Link entries back to their groups. This will recreate the original raw structure,
				// which can be saved back to the KeePass database file.
				if(entryList[groupObject.UUID]) {
					groupObject.Entry = entryList[groupObject.UUID];
				}
				
				// Store the modified group object in the result list
				groupList.push(groupObject);
			});

			return groupList;
		}

		this._database.KeePassFile.Root.Group = recursiveWalker(this.__groupTree, this.__groupEntries);
		this.$storeDatabase(this._database);
	},

	__disassemble: function() {
		function recursiveWalker(parentObject, entryList) {
			if(!Array.isArray(parentObject)) parentObject = [parentObject];
			var groupList = [];

			parentObject.forEach(function(groupObject) {
				if(groupObject !== Object(groupObject)) return;

				// Clone object so original won't be touched
				groupObject = JSON.parse(JSON.stringify(groupObject));

				// Recursively parse through all groups, so that child groups are also included
				if(groupObject.Group) {
					groupObject.Groups = recursiveWalker(groupObject.Group, entryList)[0];
					delete groupObject.Group;
				}
				
				// Store all entries in the 'entry list', so they can be linked
				// back to their groups at a later stage. To simplify other methods,
				// even groups without any entries will get an empty array.
				if(groupObject.Entry) {
					if(Array.isArray(groupObject.Entry))
						entryList[groupObject.UUID] = groupObject.Entry;
					else
						entryList[groupObject.UUID] = [groupObject.Entry];
					delete groupObject.Entry;
				} else {
					entryList[groupObject.UUID] = [];
				}

				// Store the modified group object in the result list
				groupList.push(groupObject);
			}.$bind(this));

			return [groupList, entryList];
		}

		var results = recursiveWalker(this._database.KeePassFile.Root.Group, this.__groupEntries);
		this.__groupTree = results[0];
		this.__groupEntries = results[1];
	}
});

module.exports = BasicApi;