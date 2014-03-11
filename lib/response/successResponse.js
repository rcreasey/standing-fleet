module.exports = function() {

	var pub = {};

	pub.respond = function(res, events) {

		var response = {
			ts: Date.now(),
			success: true,
		};

		if (events) {
			response.events = events;
		}

		res.send(response);
	};

	return pub;
}