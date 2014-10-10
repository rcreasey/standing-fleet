var moment = require('moment')

exports.respond = function(res, events) {

	var response = {
		ts: moment().unix(),
		success: true,
	};

	if (events) {
		response.events = events;
	}

	res.send(response);
};
