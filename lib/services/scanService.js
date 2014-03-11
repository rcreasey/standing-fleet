module.exports = function (keyGenerator, storageManager) {

	var pub = {};

	var createScan = function(headerData, scanData, armadaKey) {
		return {
			key: keyGenerator.getKey(),
			armadaKey: armadaKey,
			ts: Date.now(),
			systemId: headerData.systemId,
			systemName: headerData.systemName,
			reporter: headerData.name,
			reporterId: headerData.id,
			shipTypes: scanData
		};
	};

	pub.addAndGet = function(headerData, scanData, armadaKey, callback) {
		var scan = createScan(headerData, scanData, armadaKey);
		storageManager.addItem('scan', scan, function (error) {
			if (error) return callback(error);

			callback(null, scan);
		});
	};

	pub.getByKey = function (key, callback) {
		storageManager.getByKey('scan', key, callback);
	};

	pub.getByArmadaKey = function (armadaKey, callback) {
		storageManager.getByArmadaKey('scan', armadaKey, callback);
	};

	pub.removeByKey = function (key, callback) {
		storageManager.removeByKey('scan', key, callback);
	};

	pub.removeByArmadaKey = function (armadaKey, callback) {
		storageManager.removeByArmadaKey('scan', armadaKey, callback);
	}

	pub.getAll = function (callback) {
		storageManager.getAll('scan', callback);
	};

	return pub;
};