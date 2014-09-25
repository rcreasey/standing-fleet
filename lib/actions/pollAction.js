var root = require('path').normalize(__dirname + '/../..')
	, Member = require(root + '/models/member')

module.exports = function (successResponse, errorResponse, headerParser, sessionService, memberService, eventService, async, logger) {

	var pub = {};

	var updateSelf = function (req, callback) {
		memberService.getByKey(req.session.memberKey, function (error, member) {
			if (error) return callback(error);

			var fieldsToCompare = [
					'shipType',
					'shipTypeId',
					'systemName',
					'systemId',
					'regionId',
					'isDocked'
				],
				updated = false,
				headerData = req.session.linked || headerParser.parse(req);

			fieldsToCompare.forEach(function (field) {

				if (headerData[field] != member[field]) {
					updated = true;
					member[field] = headerData[field];
				}
			});

			member.ts = Date.now();
			if (req.session.linked) {
				sessionService.linkToMember(req, member);
				
				callback(null, true);
			} else {
				member.save(function(error) {
					if (error) return callback(error);
					if (updated) {
						eventService.addAndGet('memberUpdated', member, req.session.fleetKey, callback);
					} else {
						callback(null, true);
					}
				});
			}

		});
	};

	var checkForTriggers = function(fleetKey, oldState, newState, callback) {

		var tasks = [];

		if (!oldState.isDocked && !newState.isDocked) {
			if (oldState.shipType != 'Capsule' && newState.shipType == 'Capsule') {
				tasks.push(function (callback) {
					eventService.addAndGet('shipLost', {
						characterName: newState.characterName,
						characterId: newState.characterId,
						shipTypeName: oldState.shipType,
						shipTypeId: oldState.shipTypeId
					}, fleetKey, callback);
				});
			}
		}

		if (oldState.systemId != newState.systemId) {
			if (!newState.isLinked) {
				tasks.push(function(callback) {
					eventService.addAndGet('updateSystemMap', {
						characterId: newState.characterId,
						characterName: newState.characterName,
						systemName: newState.systemName,
						systemId: newState.systemId,
					}, fleetKey, callback);
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

		eventService.getByfleetKey(req.session.fleetKey, function (error, events) {
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
		logger.processing(req);

		memberService.getByKey(req.session.memberKey, function (error, oldState) {
			if (error) return errorResponse.respond(req, res, 'get', error);

			updateSelf(req, function (error, data) {
				if (error) return errorResponse.respond(req, res, 'selfupdate', error);

				var headers = req.session.linked || headerParser.parse(req);
				checkForTriggers(req.session.fleetKey, oldState, headers, function (error, data) {
					if (error) return errorResponse.respond(req, res, 'triggers', error);

					getNewEvents(req, function (error, newEvents) {
						if (error) return errorResponse.respond(req, res, 'newevents', error);
						try {
							successResponse.respond(res, newEvents);
						} catch (error) {
							// just silenty fail
							return true;
						}
					});

				});
			});
		});
	};

	return pub;
};
