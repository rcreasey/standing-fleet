module.exports = function (_, logger) {

	var pub = {};

	var store = {
		fleet: [],
		hostile: [],
		member: [],
		event: [],
		scan: []
	};

	pub.getByKey = function (type, key, callback) {
		// logger.log('Getting ' + type + ' ' + key + ' from memory...', 3);
		for (var i in store[type]) {
			if (store[type][i].key === key) {
				return callback(null, _.cloneDeep(store[type][i]));
			}
		}

		callback(null, false);
	};

	pub.getById = function (type, id, callback) {
		// logger.log('Getting ' + type + ' ' + id + ' from memory...', 3);
		for (var i in store[type]) {
			if (store[type][i].id === id) {
				return callback(null, _.cloneDeep(store[type][i]));
			}
		}

		callback(null, false);
	};

	pub.getByfleetKey = function (type, fleetKey, callback) {
		// logger.log('Getting all ' + type + 's belonging to ' + fleetKey + ' from memory...', 3);
		callback(null, store[type].filter(function (item) {
			return item.fleetKey === fleetKey;
		}));
	};

	pub.addItem = function (type, data, callback) {
		// logger.log('Setting ' + type + ' ' + data.key + ' in memory...', 3);
		store[type].push(_.cloneDeep(data));

		callback(null, true);
	};

	pub.removeByKey = function (type, key, callback) {
		// logger.log('Removing ' + type + ' ' + key + ' from memory...', 3);
		store[type] = store[type].filter(function (item) {
			return item.key !== key;
		});

		callback(null, true);
	};

	pub.removeByfleetKey = function (type, fleetKey, callback) {
		// logger.log('Removing all ' + type + ' that has fleetKey ' + fleetKey + ' from memory...', 3);
		store[type] = store[type].filter(function (item) {
			return item.fleetKey !== fleetKey;
		});

		callback(null, true);
	};

	pub.removeBySystemId = function (type, systemId, callback) {
		// logger.log('Removing all ' + type + ' that has systemId ' + systemId + ' from memory...', 3);
		store[type] = store[type].filter(function (item) {
			return item.systemId !== systemId;
		});

		callback(null, true);
	};

	pub.getAll = function (type, callback) {
		// logger.log('Getting all ' + type + 's from memory...', 3);
		callback(null, _.cloneDeep(store[type]));
	};


	pub.updateItem = function (type, key, data, callback) {
		// logger.log('Updating ' + type + ' ' + key + ' in memory...', 3);
		for (var i in store[type]) {
			if (store[type][i].key === key) {
				store[type].splice(i, 1, _.cloneDeep(data));
			}
		}
		callback(null, true);
	}

	return pub;
};
