module.exports = function (fleetService, memberService, sessionService, eventService, errorResponse, successResponse, headerParser, settings, logger) {

	var pub = {};

	pub.run = function (req, res) {
		logger.processing(req);

		sessionService.checkIfValid(req, function (error, isValid) {
			if (isValid) {
				return errorResponse.respond(req, res, 'state',
					'Please <a href="#" onclick="leaveFleet()">leave your current Standing Fleet</a> before creating a new one.');
			}

			var fleetPassword = req.body.fleetPassword || false;

			if ( fleetPassword &&
				 ( fleetPassword.length > settings.fleetPasswordMaxLength
				|| fleetPassword.length < settings.fleetPasswordMinLength)) {

				return errorResponse.respond(req, res, 'input',
					'Invalid password. Must consist of ' + settings.fleetPasswordMinLength + ' to ' + settings.fleetPasswordMaxLength + ' characters.');
			}

			fleetService.addAndGet(fleetPassword, function (error, fleet) {
				if (error) return errorResponse.respond(req, res, 'state', 'Error creating fleet.');

				memberService.addAndGet(headerParser.parse(req), fleet.key, function (error, member) {
					if (error) return errorResponse.respond(req, res, 'state', 'Error creating member.');

					var event = {id: member.id, name: member.name};
					eventService.addAndGet('fleetCreated', event, fleet.key, function (error) {
						if (error) return errorResponse.respond(req, res, 'state', 'Error alerting fleet.');

						sessionService.initialize(req, fleet.key, member.key);
						successResponse.respond(res, eventService.getNonAttached('statusFleet', fleet));

					});
				});
			});
		});
	};

	return pub;
};
