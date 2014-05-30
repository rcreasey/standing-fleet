module.exports = function(headerParser, errorResponse, sessionService) {

	var pub = {};

	pub.validateHeaders = function(req, res, callback) {
		var headers = headerParser.parse(req);

		if (headers.trusted && headers.trusted.toLowerCase() === 'no') {
			var message = 'To use Armada, you need to enable trust for this domain. Please enable trust and refresh.';
			return errorResponse.respond(res, 'trust', message);
		}

		if (   !headers.trusted
			|| !headers.name
			|| !headers.systemName
//			|| !headers.shipTypeId
//			|| !headers.shipType // Ship related headers are inconsistent, can't be relied upon
//			|| !headers.shipName
			|| !headers.id
			|| !headers.systemId) {

			var message = 'You do not seem to be running the IGB, or your request was corrupted.';
			return errorResponse.respond(res, 'request', message);
		}

		callback();
	};

	pub.validateSession = function(req, res, callback) {
		sessionService.checkIfValid(req, function (error, isValid) {
			if (!isValid) {
				var message = 'Invalid or no session.';
				return errorResponse.respond(res, 'session', message);
			} else {
				callback();
			}
		});
	};

	pub.validatePoll = function(req, res, callback) {
		if (!sessionService.verifyPoll(req)) {
			var message = 'You are polling too quickly.';
			return errorResponse.respond(res, 'session', message);
		}

		callback();
	};

	return pub;
};