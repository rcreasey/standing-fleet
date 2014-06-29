module.exports = function (armadaService, memberService, sessionService, eventService, errorResponse, successResponse, headerParser, settings) {

	var pub = {};

	pub.run = function (req, res) {
		sessionService.checkIfValid(req, function (error, isValid) {
			if (isValid) {
				return errorResponse.respond(res, 'state',
					'Please <a href="#" onclick="leaveArmada()">leave your current Standing Fleet</a> before creating a new one.');
			}

			var armadaPassword = req.params.armadaPassword || false;

			if (armadaPassword &&
				(armadaPassword.length > settings.armadaPasswordMaxLength
					|| armadaPassword.length < settings.armadaPasswordMinLength)) {

				return errorResponse.respond(res, 'input',
					'Invalid password. Must consist of ' + settings.armadaPasswordMinLength
					+ ' to ' + settings.armadaPasswordMaxLength + ' characters.');
			}

			armadaService.addAndGet(armadaPassword, function (error, armada) {
				if (error) return errorResponse.respond(res, 'state',
					'Error creating armada.');

				memberService.addAndGet(headerParser.parse(req), armada.key, function (error, member) {
					if (error) return errorResponse.respond(res, 'state',
						'Error creating member.');

					eventService.addAndGet('armadaCreated', {
						name: member.name,
						id: member.id
					}, armada.key, function (error) {
						if (error) return errorResponse.respond(res, 'state',
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
