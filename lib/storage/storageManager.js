module.exports = function (memoryClient, mongoDbClient, cacheLayer, settings, logger) {

	var pub = {},
		clients = {
			'memory': memoryClient,
			'mongodb': mongoDbClient,
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

	pub.getByfleetKey = function (type, fleetKey, callback) {
		// logger.log('Getting all ' + type + 's from fleet ' + fleetKey + '...', 1);

		if (settings.enableCache) {
			var cacheResult = cacheLayer.getByfleetKey(type, fleetKey);
			if (cacheResult.length) return callback(null, cacheResult);
		}

		getStore().getByfleetKey(type, fleetKey, function (error, storeResult) {
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

	pub.removeByfleetKey = function (type, fleetKey, callback) {
		// logger.log('Removing all ' + type + ' with fleet key ' + fleetKey + '...', 1);

		getStore().removeByfleetKey(type, fleetKey, function (error) {
			if (error) callback(error);

			if (settings.enableCache) cacheLayer.removeByfleetKey(type, fleetKey);
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
