module.exports = function (armadaService, memberService, sessionService, eventService, errorResponse, successResponse, headerParser, settings, logger) {

	var pub = {};

	pub.run = function (req, res) {
		logger.processing(req);

		sessionService.checkIfValid(req, function (error, isValid) {
			if (isValid) {
				return errorResponse.respond(req, res, 'state',
					'Please <a href="#" onclick="leaveArmada()">leave your current Standing Fleet</a> before creating a new one.');
			}

			var fleetPassword = req.params.fleetPassword || false;

			if (fleetPassword &&
				(fleetPassword.length > settings.fleetPasswordMaxLength
					|| fleetPassword.length < settings.fleetPasswordMinLength)) {

				return errorResponse.respond(req, res, 'input',
					'Invalid password. Must consist of ' + settings.fleetPasswordMinLength
					+ ' to ' + settings.fleetPasswordMaxLength + ' characters.');
			}

			armadaService.addAndGet(fleetPassword, function (error, armada) {
				if (error) return errorResponse.respond(req, res, 'state',
					'Error creating armada.');

				memberService.addAndGet(headerParser.parse(req), armada.key, function (error, member) {
					if (error) return errorResponse.respond(req, res, 'state',
						'Error creating member.');

					eventService.addAndGet('armadaCreated', {
						name: member.name,
						id: member.id
					}, armada.key, function (error) {
						if (error) return errorResponse.respond(req, res, 'state',
							'Error alerting armada.');

						sessionService.initialize(req, armada.key, member.key);
						successResponse.respond(res, eventService.getNonAttached('statusArmada', armada));

					});
				});
			});
		});
	};

	return pub;
};
