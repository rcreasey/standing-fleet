module.exports = function (keyGenerator, storageManager) {

	var pub = {};

	var createScan = function(headerData, scanData, fleetKey) {
		return {
			key: keyGenerator.getKey(),
			fleetKey: fleetKey,
			ts: Date.now(),
			systemId: headerData.systemId,
			systemName: headerData.systemName,
			reporter: headerData.name,
			reporterId: headerData.id,
			shipClasses: scanData.classes,
			shipTypes: scanData.types
		};
	};

	pub.addAndGet = function(headerData, scanData, fleetKey, callback) {
		var scan = createScan(headerData, scanData, fleetKey);
		storageManager.addItem('scan', scan, function (error) {
			if (error) return callback(error);

			callback(null, scan);
		});
	};

	pub.getByKey = function (key, callback) {
		storageManager.getByKey('scan', key, callback);
	};

	pub.getByfleetKey = function (fleetKey, callback) {
		storageManager.getByfleetKey('scan', fleetKey, callback);
	};

	pub.removeByKey = function (key, callback) {
		storageManager.removeByKey('scan', key, callback);
	};

	pub.removeByfleetKey = function (fleetKey, callback) {
		storageManager.removeByfleetKey('scan', fleetKey, callback);
	}

	pub.getAll = function (callback) {
		storageManager.getAll('scan', callback);
	};

	return pub;
};
