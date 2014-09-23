var root = require('path').normalize(__dirname + '/../..')
	, Fleet = require(root + '/models/fleet')

module.exports = function (keyGenerator) {

	var pub = {};

	var createFleet = function(password) {
		return new Fleet({
			key: keyGenerator.getKey(),
			password: password || false
		});
	};

	pub.addAndGet = function(password, callback) {
		var fleet = createFleet(password);

		fleet.save(function(error) {
      if (error) return callback(error);

      callback(null, fleet);
    });
	};

	pub.getByKey = function (key, callback) {
  	Fleet.findOne({key: key}, '-_id ts key password', callback);
	};

	pub.getAll = function (callback) {
		Fleet.find({}, '-_id ts key password', callback);
	};

	pub.removeByKey = function (key, callback) {
    Fleet.remove({key: key}, callback);
	};

	return pub;
};
