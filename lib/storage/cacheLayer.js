module.exports = function (logger, _) {

	var pub = {};

	var store = {
		armada: [],
		member: [],
		event: [],
		scan: []
	};

	pub.getByKey = function (type, key) {
		logger.log('Getting ' + type + ' ' + key + ' from cache...', 2);

		for (var i in store[type]) {
			if (store[type][i].key === key) {
				return _.cloneDeep(store[type][i]);
			}
		}
		return false;
	};

	pub.getByArmadaKey = function (type, armadaKey) {
		logger.log('Getting all ' + type + 's belonging to ' + armadaKey + ' from cache...', 2);
		return _.cloneDeep(store[type].filter(function (item) {
			return item.armadaKey === armadaKey;
		}));
	};

	pub.removeByKey = function (type, key) {
		logger.log('Removing ' + type + ' ' + key + ' from cache...', 2);
		store[type] = store[type].filter(function (item) {
			return item.key !== key;
		});
	};

	pub.removeByArmadaKey = function (type, armadaKey) {
		logger.log('Removing all ' + type + 's with armada key ' + armadaKey + ' from cache...', 2);
		store[type] = store[type].filter(function (item) {
			return item.armadaKey !== armadaKey;
		});
	};

	pub.getAll = function (type, key) {
		logger.log('Getting all ' + type + 's from cache...', 2);
		return _.cloneDeep(store[type]);
	};

	pub.upsertItem = function (type, item) {
		logger.log('Updating ' + type + ' ' + item.key + ' in cache...', 2);
		for (var i in store[type]) {
			if (store[type][i].key === item.key) {
				store[type].splice(i, 1, item);
				return;
			}
		}
		store[type].push(item);
	};

	pub.clear = function () {
		store = {
			armada: [],
			member: [],
			event: [],
			scan: []
		};
	};

	return pub;
};