module.exports = function(headerParser, errorResponse, sessionService) {

	var pub = {};

	pub.validateHeaders = function(req, res, next) {
		var headers = req.session.linked || headerParser.parse(req);

		if (headers.trusted && headers.trusted.toLowerCase() === 'no') {
			var message = 'To use Standing Fleet, you need to enable trust for this domain. Please enable trust and refresh.';
			return errorResponse.respond(req, res, 'trust', message);
		}

		if ( !headers.trusted
			|| !headers.characterName
			|| !headers.characterId
			|| !headers.systemName
			|| !headers.systemId) {

			var message = 'You do not seem to be running the IGB, or your request was corrupted.';
			return errorResponse.respond(req, res, 'igb-headers', message);
		}

		next();
	};

	pub.validateSession = function(req, res, next) {
		sessionService.checkIfValid(req, function (error, isValid) {
			if (!isValid) {
				var message = 'Invalid or no session.';
				return errorResponse.respond(req, res, 'session', message);
			} else {
				next();
			}
		});
	};

	pub.validatePoll = function(req, res, next) {
		// if (!sessionService.verifyPoll(req)) {
		// 	var message = 'You are polling too quickly.';
		// 	return errorResponse.respond(req, res, 'session', message);
		// }

		next();
	};

	return pub;
};
