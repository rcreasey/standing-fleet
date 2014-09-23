module.exports = function (memberService, hostileService, eventService, scanService, fleetService, settings, logger, _) {

	var cleanLoopTimer = 0;

	var cleanMembers = function (callback) {
		memberService.getAll(function (error, allMembers) {
			for (var i in allMembers) {
				if ((Date.now() - allMembers[i].ts) > settings.memberTtl) {
					memberService.removeByKey(allMembers[i].key, _.noop);
					eventService.addAndGet('memberTimedOut',
							{ name: allMembers[i].name, id: allMembers[i].id }, allMembers[i].fleetKey, _.noop);
				}
			}
		});
	};

	var cleanHostiles = function (callback) {
		hostileService.getAll(function (error, allHostiles) {
			for (var i in allHostiles) {
				if ((Date.now() - allHostiles[i].ts) > settings.hostileTtl) {
					hostileService.removeByKey(allHostiles[i].key, _.noop);
					eventService.addAndGet('hostileTimedOut',
							{ name: allHostiles[i].name, id: allHostiles[i].id, systemId: allHostiles[i].systemId, systemName: allHostiles[i].systemName}, allHostiles[i].fleetKey, _.noop);
				}
			}
		});
	};

	var cleanEvents = function (callback) {
		eventService.getAll(function (error, allEvents) {
			for (var i in allEvents) {
				if ((Date.now() - allEvents[i].ts) > settings.eventTtl) {
					eventService.removeByKey(allEvents[i].key, _.noop);
				}
			}
		});
	};

	var cleanScans = function (callback) {
		scanService.getAll(function (error, allScans) {
			for (var i in allScans) {
				if ((Date.now() - allScans[i].ts) > settings.scanTtl) {
					scanService.removeByKey(allScans[i].key, _.noop);
				}
			}
		});
	};

	var cleanFleets = function (callback) {
		fleetService.getAll(function (error, allFleets) {
			for (var i in allFleets) {
				memberService.getByfleetKey(allFleets[i].key, function (error, members) {
					if ( ((Date.now() - allFleets[i].ts) > settings.fleetTtl) && members.length < 1 ) {
						fleetService.removeByKey(allFleets[i].key, _.noop);
						eventService.removeByfleetKey(allFleets[i].key, _.noop);
						scanService.removeByfleetKey(allFleets[i].key, _.noop);
						hostileService.removeByfleetKey(allFleets[i].key, _.noop);
					}
				})
			}
		});
	};

	var cleanLoop = function () {
		cleanLoopTimer = setTimeout(function () {
			logger.log('Cleaning up data...');
			cleanEvents();
			cleanScans();
			cleanMembers();
			cleanHostiles();
			cleanFleets();
			cleanLoop();
		}, settings.cleanInterval);
	};

	var startCleaning = function () {
		clearTimeout(cleanLoopTimer);
		cleanLoop();
	}

	var stopCleaning = function () {
		clearTimeout(cleanLoopTimer);
	}

	return {
		startCleaning: startCleaning,
		stopCleaning: stopCleaning
	};
};
