var _ = require('lodash')
  , header_parser = require(__dirname + '/../middleware/header-parser')

exports.respond = function(req, res, type, message) {
	var headers = req.session.linked || header_parser(req);
	var response = {
		ts: Date.now(),
		success: false,
		error: {
			type: type,
			message: message
		}
	};

	if (_.contains(['session', 'igb-headers', 'trust'], type)) response.error.stopPoll = true;

	res.send(response);
};
