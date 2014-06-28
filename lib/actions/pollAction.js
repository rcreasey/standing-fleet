module.exports = function (successResponse, errorResponse, headerParser, memberService, eventService, async, settings) {

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
					'isDocked'
				],
				updated = false,
				headerData = headerParser.parse(req);

			fieldsToCompare.forEach(function (field) {
				if (headerData[field] !== member[field]) {
					updated = true;
					member[field] = headerData[field];
				}
			});

			member.ts = Date.now();
			memberService.update(req.session.memberKey, member, function (error, data) {
				if (error) return callback(error);

				if (updated) {
					eventService.addAndGet('memberUpdated', member, req.session.armadaKey, callback);
				} else {
					callback(null, true);
				}
			});
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
			tasks.push(function(callback) {
				eventService.addAndGet('updateSystemMap', {
					id: newState.id,
					name: newState.name,
					system_name: newState.systemName,
					system_id: newState.systemId
				}, armadaKey, callback);
			})
		}

		if (tasks.length) {
			async.parallel(tasks, function (error, results) {
				callback(null, true);
			});

		} else {
			callback(null, true);
		}
	};

	var getNewEvents = function (req, callback) {

		// Use req.params.lastPollTs as long as it is not further back than polling interval x2
		var lastPollTs = Math.max(parseInt(req.params.lastPollTs, 10), Date.now() - (settings.minPollInterval*2));

		eventService.getByArmadaKey(req.session.armadaKey, function (error, events) {
			var newEvents = [];

			events.forEach(function (event) {
				if (event.ts > lastPollTs) {
					newEvents.push(event);
				}
			});

			callback (null, newEvents);
		});
	};

	pub.run = function (req, res) {
		memberService.getByKey(req.session.memberKey, function (error, oldState) {
			if (error) errorResponse.respond(res, 'get', error);

			updateSelf(req, function (error, data) {
				if (error) errorResponse.respond(res, 'selfupdate', error);

					checkForTriggers(req.session.armadaKey, oldState, headerParser.parse(req), function (error, data) {
						if (error) errorResponse.respond(res, 'triggers', error);

						getNewEvents(req, function (error, newEvents) {
							if (error) errorResponse.respond(res, 'newevents', error);

						successResponse.respond(res, newEvents);
					});
				});
			});
		});
	};

	return pub;
};
