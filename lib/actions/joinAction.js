module.exports = function (errorResponse, successResponse, headerParser, memberService, eventService, armadaService, sessionService) {
	
	var pub = {};

	pub.run = function (req, res) {
		sessionService.checkIfValid(req, function (error, isValid) {
			if (isValid) {
				return errorResponse.respond(res, 'state', 
					'Please leave your current armada before joining a new one.');
			}

			armadaService.getByKey(req.params.armadaKey, function (error, armada) {
				if (error) return errorResponse.respond(res, 'init', 'Error finding armada.');

				if (!armada) {
					return errorResponse.respond(res, 'input', 
						'Invalid armada key.');
				}

				if (armada.password && (req.params.armadaPassword !== armada.password)) {
					return errorResponse.respond(res, 'password', 'Invalid password.');
				}

				memberService.addAndGet(headerParser.parse(req), armada.key, function (error, member) {
					if (error) return errorResponse.respond(res, 'init', 'Error creating member.');

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