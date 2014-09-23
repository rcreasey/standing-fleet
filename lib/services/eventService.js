module.exports = function (keyGenerator, storageManager) {

	var pub = {};

	var createEvent = function(type, data, fleetKey) {
		return {
			key: keyGenerator.getKey(),
			fleetKey: fleetKey,
			ts: Date.now(),
			type: type,
			data: data || {}
		};
	};

	pub.getNonAttached = function (type, data) {
		return createEvent(type, data, 'none');
	};

	pub.addAndGet = function(type, data, fleetKey, callback) {
		var event = createEvent(type, data, fleetKey);
		storageManager.addItem('event', event, function (error) {
			if (error) return callback(error);

			callback(null, event);
		});
	};

	pub.getByKey = function (key, callback) {
		storageManager.getByKey('event', key, callback);
	};

	pub.getByfleetKey = function (fleetKey, callback) {
		storageManager.getByfleetKey('event', fleetKey, callback);
	};

	pub.removeByKey = function (key, callback) {
		storageManager.removeByKey('event', key, callback);
	};

	pub.removeByfleetKey = function (fleetKey, callback) {
		storageManager.removeByfleetKey('event', fleetKey, callback);
	};

	pub.getAll = function (callback) {
		storageManager.getAll('event', callback);
	};

	return pub;
};