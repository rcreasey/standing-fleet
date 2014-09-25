var root = require('path').normalize(__dirname + '/../..')
	, Event = require(root + '/models/event')

module.exports = function (keyGenerator) {

	var pub = {};

	var createEvent = function(type, data, fleetKey) {
		return new Event({
      key: keyGenerator.getKey(),
      fleetKey: fleetKey,
      type: type,
      data: data || {}
		});
	};

	pub.getNonAttached = function (type, data) {
		return createEvent(type, data, 'none');
	};

	pub.addAndGet = function(type, data, fleetKey, callback) {
		var event = createEvent(type, data, fleetKey);

		event.save(function(error) {
      if (error) return callback(error);

      callback(null, event);
    });
	};

	pub.getByKey = function (key, callback) {
    Event.findOne({key: key}, '-_id', callback);
	};

	pub.getByfleetKey = function (fleetKey, callback) {
		Event.find({fleetKey: fleetKey}, '-_id', callback);
	};

	pub.removeByKey = function (key, callback) {
		Event.remove({key: key}, callback);
	};

	pub.removeByfleetKey = function (fleetKey, callback) {
		Event.remove({fleetKey: fleetKey}, callback);
	};

	pub.getAll = function (callback) {
		Event.find({}, '-_id', callback);
	};

	return pub;
};
