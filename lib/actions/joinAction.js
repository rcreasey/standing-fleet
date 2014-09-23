module.exports = function (errorResponse, successResponse, headerParser, memberService, eventService, armadaService, sessionService, logger) {

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
					'Please leave your current armada before joining a new one.');
			}

			armadaService.getByKey(req.params.fleetKey, function (error, armada) {
				if (error) return errorResponse.respond(req, res, 'init', 'Error finding armada.');

				if (!armada) {
					return errorResponse.respond(req, res, 'input',
						'Invalid Fleet key.');
				}

				if (armada.password && (req.params.fleetPassword !== armada.password)) {
					return errorResponse.respond(req, res, 'password', 'Invalid password.');
				}

				memberService.addAndGet(headerParser.parse(req), armada.key, function (error, member) {
					if (error) return errorResponse.respond(req, res, 'init', 'Error creating member.');

					eventService.addAndGet('memberJoined', member, armada.key, function (error, event) {
						sessionService.initialize(req, armada.key, member.key);
						successResponse.respond(res);
					});
				});
			});
		});
	};

	return pub;
};
