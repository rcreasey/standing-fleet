var moment = require('moment')
  , _ = require('lodash')
  , header_parser = require(__dirname + '/../middleware/header-parser')

exports.respond = function(res, type, message) {
	var response = {
		ts: moment().unix(),
		success: false,
		error: {
			type: type,
			message: message
		}
	};

	if (_.contains(['session', 'igb-headers', 'trust'], type)) response.error.stopPoll = true;

	res.send(response);
};
