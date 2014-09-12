module.exports = function (successResponse, errorResponse, headerParser, sessionService, memberService, eventService, async, logger) {

	var pub = {};

	var updateSelf = function (req, callback) {
		memberService.getByKey(req.session.memberKey, function (error, member) {
			if (error) return callback(error);

			var fieldsToCompare = [
					'shipType',
					'shipTypeId',
					'shipName',
					'systemName',
					'systemId',
					'regionId',
					'isDocked'
				],
				updated = false,
				headerData = req.session.linked || headerParser.parse(req);

			fieldsToCompare.forEach(function (field) {

				if (headerData[field] !== member[field]) {
					updated = true;
					member[field] = headerData[field];
				}
			});

			member.ts = Date.now();
			if (req.session.linked) {
				sessionService.linkToMember(req, member);
				callback(null, true);
			} else {
				memberService.update(req.session.memberKey, member, function (error, data) {
					if (error) return callback(error);

					if (updated) {
						eventService.addAndGet('memberUpdated', member, req.session.armadaKey, callback);
					} else {
						callback(null, true);
					}
				});
			}

		});
	};

	var checkForTriggers = function(armadaKey, oldState, newState, callback) {

		var tasks = [];

		if (!oldState.isDocked && !newState.isDocked) {
			if (oldState.shipType !== 'Capsule' && newState.shipType === 'Capsule') {
				tasks.push(function (callback) {
					eventService.addAndGet('shipLost', {
						name: newState.name,
						id: newState.id,
						shipTypeName: oldState.shipType,
						shipTypeId: oldState.shipTypeId
					}, armadaKey, callback);
				});
			}
		}

		if (oldState.systemId !== newState.systemId) {
			if (!newState.isLinked) {
				tasks.push(function(callback) {
					eventService.addAndGet('updateSystemMap', {
						id: newState.id,
						name: newState.name,
						systemName: newState.systemName,
						systemId: newState.systemId,
					}, armadaKey, callback);
				})
			}
		}

		if (tasks.length) {
			async.parallel(tasks, function (error, results) {
				callback(null, true);
			});

		} else {
			callback(null, true);
		}
	};

	var getNewEvents = function (req, next) {
		var lastPollTs = +req.params.lastPollTs;

		eventService.getByArmadaKey(req.session.armadaKey, function (error, events) {
			if (error) next(error);
			var newEvents = [];

			if (events) {
				events.forEach(function (event) {
					if (event.ts >= lastPollTs) newEvents.push(event);
				});
			}

			next(null, newEvents);
		});
	};

	pub.run = function (req, res) {
		logger.log('Processing \'poll\' request', 0);

		memberService.getByKey(req.session.memberKey, function (error, oldState) {
			if (error) errorResponse.respond(req, res, 'get', error);

			updateSelf(req, function (error, data) {
				if (error) errorResponse.respond(req, res, 'selfupdate', error);

				var headers = req.session.linked || headerParser.parse(req);
				checkForTriggers(req.session.armadaKey, oldState, headers, function (error, data) {
					if (error) errorResponse.respond(req, res, 'triggers', error);

					getNewEvents(req, function (error, newEvents) {
						if (error) logger.log("ERROR: [getNewEvents] " + JSON.stringify(error))
						// if (error) errorResponse.respond(req, res, 'newevents', error);
						successResponse.respond(res, newEvents);
					});

				});
			});
		});
	};

	return pub;
};
