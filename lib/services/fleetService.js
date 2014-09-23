module.exports = function (keyGenerator, storageManager) {

	var pub = {};

	var createFleet = function(password) {
		return {
			ts: Date.now(),
			password: password || false,
			key: keyGenerator.getKey()
		};
	};

	pub.addAndGet = function(password, callback) {
		var fleet = createFleet(password);
		storageManager.addItem('fleet', fleet, function (error) {
			if (error) return callback(error);

			callback(null, fleet);
		});
	};

	pub.getByKey = function (key, callback) {
		storageManager.getByKey('fleet', key, callback);
	};

	pub.removeByKey = function (key, callback) {
		storageManager.removeByKey('fleet', key, callback);
	};

	pub.getAll = function (callback) {
		storageManager.getAll('fleet', callback);
	};

	return pub;
};
