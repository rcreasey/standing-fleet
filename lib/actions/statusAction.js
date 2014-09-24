module.exports = function (fleetService, memberService, hostileService, sessionService, eventService, scanService, successResponse, errorResponse, headerParser, async, logger) {

	var pub = {};

	var showStatusForNonExisting = function (req, res) {
		var self = memberService.getNonAttached(headerParser.parse(req))
		var eventsResponse = [eventService.getNonAttached('statusSelf', {
				characterName: self.characterName,
				characterId: self.characterId,
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
			fleet:  function (callback) {
				fleetService.getByKey(req.session.fleetKey, callback);
			},
			hostiles:  function (callback) {
				hostileService.getByfleetKey(req.session.fleetKey, callback);
			},
			members:  function (callback) {
				memberService.getByfleetKey(req.session.fleetKey, callback);
			},
			scans:  function (callback) {
				scanService.getByfleetKey(req.session.fleetKey, callback);
			},
			events:  function (callback) {
				eventService.getByfleetKey(req.session.fleetKey, callback);
			},
		};

		async.parallel(tasks, function (error, data) {
			eventsResponse = [];

			eventsResponse.push(eventService.getNonAttached('statusSelf', {
				characterName: data.self.characterName,
				characterId: data.self.characterId,
				key: data.self.key,
				systemId: data.self.systemId,
				status: data.self.status
			}));

			eventsResponse.push(eventService.getNonAttached('statusFleet', data.fleet));
			eventsResponse.push(eventService.getNonAttached('statusHostiles', data.hostiles));
			eventsResponse.push(eventService.getNonAttached('statusMembers', data.members));
			eventsResponse.push(eventService.getNonAttached('statusEvents', data.events));
			eventsResponse.push(eventService.getNonAttached('statusScans', data.scans));

			successResponse.respond(res, eventsResponse);
		});
	}

	pub.run = function (req, res) {
		logger.processing(req);

		if (!req.session.memberKey || !req.session.fleetKey) {
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
