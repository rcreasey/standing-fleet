
exports.respond = function(res, events) {

	var response = {
		// TODO use moment
		ts: Date.now(),
		success: true,
	};

	if (events) {
		response.events = events;
	}

	res.send(response);
};
