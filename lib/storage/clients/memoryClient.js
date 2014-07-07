module.exports = function (_, logger) {

	var pub = {};

	var store = {
		armada: [],
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

	pub.getByArmadaKey = function (type, armadaKey, callback) {
		// logger.log('Getting all ' + type + 's belonging to ' + armadaKey + ' from memory...', 3);
		callback(null, store[type].filter(function (item) {
			return item.armadaKey === armadaKey;
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

	pub.removeByArmadaKey = function (type, armadaKey, callback) {
		// logger.log('Removing all ' + type + ' that has armadaKey ' + armadaKey + ' from memory...', 3);
		store[type] = store[type].filter(function (item) {
			return item.armadaKey !== armadaKey;
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
