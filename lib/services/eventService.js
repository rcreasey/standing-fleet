module.exports = function (keyGenerator, storageManager) {

	var pub = {};

	var createEvent = function(type, data, armadaKey) {
		return {
			key: keyGenerator.getKey(),
			armadaKey: armadaKey,
			ts: Date.now(),
			type: type,
			data: data || {}
		};
	};

	pub.getNonAttached = function (type, data) {
		return createEvent(type, data, 'none');
	};

	pub.addAndGet = function(type, data, armadaKey, callback) {
		var event = createEvent(type, data, armadaKey);
		storageManager.addItem('event', event, function (error) {
			if (error) return callback(error);

			callback(null, event);
		});
	};

	pub.getByKey = function (key, callback) {
		storageManager.getByKey('event', key, callback);
	};

	pub.getByArmadaKey = function (armadaKey, callback) {
		storageManager.getByArmadaKey('event', armadaKey, callback);
	};

	pub.removeByKey = function (key, callback) {
		storageManager.removeByKey('event', key, callback);
	};

	pub.removeByArmadaKey = function (armadaKey, callback) {
		storageManager.removeByArmadaKey('event', armadaKey, callback);
	};

	pub.getAll = function (callback) {
		storageManager.getAll('event', callback);
	};

	return pub;
};