var root = require('path').normalize(__dirname + '/../..')
	, Scan = require(root + '/models/hostile')

module.exports = function (keyGenerator) {

	var pub = {};

	var createScan = function(headerData, scanData, fleetKey) {
		return new Scan({
			key: keyGenerator.getKey(),
			fleetKey: fleetKey,
			systemId: headerData.systemId,
			systemName: headerData.systemName,
			reporter: headerData.name,
			reporterId: headerData.id,
			shipClasses: scanData.classes,
			shipTypes: scanData.types
		});
	};

	pub.addAndGet = function(headerData, scanData, fleetKey, callback) {
		var scan = createScan(headerData, scanData, fleetKey);

		scan.save(function(error) {
			if (error) return callback(error);

			callback(null, scan);
		});
	};

	pub.getByKey = function (key, callback) {
		Scan.find({key: key}, callback);
	};

	pub.getByfleetKey = function (fleetKey, callback) {
		Scan.find({fleetKey: fleetKey}, callback);
	};

	pub.getAll = function (callback) {
		Scan.find({}, callback);
	};

	pub.removeByKey = function (key, callback) {
		Scan.remove({key: key}, callback);
	};

	pub.removeByfleetKey = function (fleetKey, callback) {
		Scan.remove({fleetKey: fleetKey}, callback);
	}

	return pub;
};
