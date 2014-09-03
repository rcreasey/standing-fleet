module.exports = function (armadaService, memberService, hostileService, sessionService, eventService, scanService, successResponse, errorResponse, headerParser, async, logger) {

	var pub = {};

	var showStatusForNonExisting = function (req, res) {
		var self = memberService.getNonAttached(headerParser.parse(req)),
			eventsResponse = [eventService.getNonAttached('statusSelf', {
				name: self.name,
				id: self.id,
				status: self.status
			})];

		successResponse.respond(res, eventsResponse);
	};

	var showStatusForMember = function (req, res) {
		if (!sessionService.verifyStatus(req)) {
			return errorResponse.respond(req, res, 'status', 'You are checking status too frequently');
		}

		var tasks = {
			self: function (callback) {
				memberService.getByKey(req.session.memberKey, callback);
			},
			armada:  function (callback) {
				armadaService.getByKey(req.session.armadaKey, callback);
			},
			hostiles:  function (callback) {
				hostileService.getByArmadaKey(req.session.armadaKey, callback);
			},
			members:  function (callback) {
				memberService.getByArmadaKey(req.session.armadaKey, callback);
			},
			scans:  function (callback) {
				scanService.getByArmadaKey(req.session.armadaKey, callback);
			},
			events:  function (callback) {
				eventService.getByArmadaKey(req.session.armadaKey, callback);
			},
		};

		async.parallel(tasks, function (error, data) {
			eventsResponse = [];

			eventsResponse.push(eventService.getNonAttached('statusSelf', {
				name: data.self.name,
				id: data.self.id,
				key: data.self.key,
				systemId: data.self.systemId,
				status: data.self.status
			}));

			eventsResponse.push(eventService.getNonAttached('statusArmada', data.armada));
			eventsResponse.push(eventService.getNonAttached('statusHostiles', data.hostiles));
			eventsResponse.push(eventService.getNonAttached('statusMembers', data.members));
			eventsResponse.push(eventService.getNonAttached('statusEvents', data.events));
			eventsResponse.push(eventService.getNonAttached('statusScans', data.scans));

			successResponse.respond(res, eventsResponse);
		});
	}

	pub.run = function (req, res) {
		logger.log('Processing \'status\' request', 0);

		if (!req.session.memberKey || !req.session.armadaKey) {
			return showStatusForNonExisting(req, res);
		}

		memberService.getByKey(req.session.memberKey, function (error, member) {
			sessionService.checkIfValid(req, function (error, isValid) {
				if (member && isValid) {
					showStatusForMember(req, res);
				} else {
					showStatusForNonExisting(req, res);
				}
	 		});
		});
	};

	return pub;
};
