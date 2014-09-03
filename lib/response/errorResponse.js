module.exports = function(headerParser, logger) {

	var pub = {};

	pub.respond = function(req, res, type, message) {
		var headers = req.session.linked || headerParser.parse(req);

		logger.log('Error Response: ' + JSON.stringify(req.params) + ' (' + JSON.stringify(headers) + ')')

		var response = {
			ts: Date.now(),
			success: false,
			error: {
				type: type,
				message: message
			}
		};

		res.send(response);
	};

	return pub;
}
