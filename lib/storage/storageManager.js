module.exports = function (memoryClient, mongoDbClient, cacheLayer, settings, logger) {

	var pub = {},
		clients = {
			'memory': memoryClient,
			'mongoDb': mongoDbClient,
		};

	var getStore = function () {
		return clients[settings.storage];
	};

	pub.getByKey = function (type, key, callback) {
		// logger.log('Getting ' + type + ' ' + key + '...', 1);

		if (settings.enableCache) {
			var cacheResult = cacheLayer.getByKey(type, key);
			if (cacheResult) return callback(null, cacheResult);
		}

		// logger.log(type + ' ' + key + ' not found in cache, getting from store...', 1);

		getStore().getByKey(type, key, function (error, storeResult) {
			if (error)  return callback(error);

			if (settings.enableCache && storeResult) cacheLayer.upsertItem(type, storeResult);
			callback(null, storeResult);
		});
	};

	pub.getById = function (type, id, callback) {

		if (settings.enableCache) {
			var cacheResult = cacheLayer.getById(type, id);
			if (cacheResult.length) return callback(null, cacheResult);
		}

		getStore().getById(type, id, function (error, storeResult) {
			if (error) return callback(error);

			if (settings.enableCache) cacheLayer.upsertItem(type, storeResult);
			callback(null, storeResult);
		});
	};

	pub.getByArmadaKey = function (type, armadaKey, callback) {
		// logger.log('Getting all ' + type + 's from armada ' + armadaKey + '...', 1);

		if (settings.enableCache) {
			var cacheResult = cacheLayer.getByArmadaKey(type, armadaKey);
			if (cacheResult.length) return callback(null, cacheResult);
		}

		getStore().getByArmadaKey(type, armadaKey, function (error, storeResult) {
			if (error) return callback(error);

			if (settings.enableCache) {
				for (var i in storeResult) {
					cacheLayer.upsertItem(type, storeResult[i]);
				}
			}

			callback(null, storeResult);
		});
	};

	pub.addItem = function (type, item, callback) {
		// logger.log('Setting ' + type + ' ' + item.key + '...', 1);

		getStore().addItem(type, item, function (error) {
			if (error) callback(error);

			if (settings.enableCache) cacheLayer.upsertItem(type, item);
			callback(null, true);
		});
	};

	pub.removeByKey = function (type, key, callback) {
		// logger.log('Removing ' + type + ' ' + key + '...');

		getStore().removeByKey(type, key, function (error) {
			if (error) callback(error);

			if (settings.enableCache) cacheLayer.removeByKey(type, key);
			callback(null, true);
		});
	};

	pub.removeByArmadaKey = function (type, armadaKey, callback) {
		// logger.log('Removing all ' + type + ' with armada key ' + armadaKey + '...', 1);

		getStore().removeByArmadaKey(type, armadaKey, function (error) {
			if (error) callback(error);

			if (settings.enableCache) cacheLayer.removeByArmadaKey(type, armadaKey);
			callback(null, true);
		});
	};

	pub.removeBySystemId = function (type, systemId, callback) {
		// logger.log('Removing all ' + type + ' with system id ' + systemId + '...', 1);

		getStore().removeBySystemId(type, systemId, function (error) {
			if (error) callback(error);

			if (settings.enableCache) cacheLayer.removeBySystemId(type, systemId);
			callback(null, true);
		});
	};

	pub.getAll = function (type, callback) {
		// logger.log('Getting all ' + type + '...', 1);

		getStore().getAll(type, function (error, items) {
			if (error) callback(error);

			if (settings.enableCache) {
				for (var i in items) {
					if (items[i].key) cacheLayer.upsertItem(type, items[i]);
				}
			}

			callback(null, items);
		});
	};

	pub.updateItem = function (type, key, item, callback) {
		// logger.log('Updating ' + type + ' ' + key + '...', 1);

		getStore().updateItem(type, key, item, function (error) {
			if (error) return callback(error);

			if (settings.enableCache) cacheLayer.upsertItem(type, item);
			callback(null, true);
		});
	};

	return pub;
};
