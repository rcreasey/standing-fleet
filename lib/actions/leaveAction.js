module.exports = function (successResponse, errorResponse, memberService, eventService, sessionService, logger) {

	var pub = {};

	pub.run = function (req, res) {
		logger.log('Processing \'leave\' request', 0);

		sessionService.checkIfValid(req, function (error, isValid) {
			if (!isValid) {
				return errorResponse.respond(req, res, 'state',
					'You do not seem to be a member of an armada.');
			}

			memberService.getByKey(req.session.memberKey, function (error, member) {
				if (error) return errorResponse.respond(req, res, 'removing', 'Error finding member');

				memberService.removeByKey(member.key, function (error) {
					if (error) return errorResponse.respond(req, res, 'removing', 'Error removing member');

					eventService.addAndGet('memberLeft', {
						name: member.name,
						id: member.id,
						key: member.key
					}, req.session.armadaKey, function (error) {
						if (error) return errorResponse.respond(req, res, 'event', 'Error creating leave event');

						req.session = null;
						successResponse.respond(res);
					});
				});
			});
		});
	};

	return pub;
};
