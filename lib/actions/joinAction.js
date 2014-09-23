module.exports = function (errorResponse, successResponse, headerParser, memberService, eventService, fleetService, sessionService, logger) {

	var pub = {};

	pub.run = function (req, res) {
		logger.processing(req);

		if (req.params.fleetPassword ) {
			logger.log('Processing \'join\' request with password', 0)
		} else {
			logger.log('Processing \'join\' request', 0);
		}

		sessionService.checkIfValid(req, function (error, isValid) {
			if (isValid) {
				return errorResponse.respond(req, res, 'state',
					'Please leave your current fleet before joining a new one.');
			}

			fleetService.getByKey(req.params.fleetKey, function (error, fleet) {
				if (error) return errorResponse.respond(req, res, 'init', 'Error finding fleet.');

				if (!fleet) {
					return errorResponse.respond(req, res, 'input',
						'Invalid Fleet key.');
				}

				if (fleet.password && (req.params.fleetPassword !== fleet.password)) {
					return errorResponse.respond(req, res, 'password', 'Invalid password.');
				}

				memberService.addAndGet(headerParser.parse(req), fleet.key, function (error, member) {
					if (error) return errorResponse.respond(req, res, 'init', 'Error creating member.');

					eventService.addAndGet('memberJoined', member, fleet.key, function (error, event) {
						sessionService.initialize(req, fleet.key, member.key);
						successResponse.respond(res);
					});
				});
			});
		});
	};

	return pub;
};
