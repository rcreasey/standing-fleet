module.exports = function(headerParser, logger, _) {

	var pub = {};

	pub.respond = function(req, res, type, message) {
		var headers = req.session.linked || headerParser.parse(req);
		var response = {
			ts: Date.now(),
			success: false,
			error: {
				type: type,
				message: message
			}
		};

		if (_.contains(['session', 'igb-headers', 'trust'], type)) response.error.stopPoll = true;

		logger.log('ERROR: ' + JSON.stringify(response) + '|' + JSON.stringify(headers) + '|' + JSON.stringify(req.params) )
		res.send(response);
	};

	return pub;
}
