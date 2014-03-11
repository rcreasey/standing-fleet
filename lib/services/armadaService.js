module.exports = function (keyGenerator, storageManager) {

	var pub = {};

	var createArmada = function(password) {
		return {
			ts: Date.now(),
			password: password || false,
			key: keyGenerator.getKey()
		};
	};

	pub.addAndGet = function(password, callback) {
		var armada = createArmada(password);
		storageManager.addItem('armada', armada, function (error) {
			if (error) return callback(error);

			callback(null, armada);
		});
	};

	pub.getByKey = function (key, callback) {
		storageManager.getByKey('armada', key, callback);
	};

	pub.removeByKey = function (key, callback) {
		storageManager.removeByKey('armada', key, callback);
	};

	pub.getAll = function (callback) {
		storageManager.getAll('armada', callback);
	};

	return pub;
};