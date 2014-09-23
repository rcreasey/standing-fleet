module.exports = function (memberService, hostileService, eventService, scanService, armadaService, settings, logger, _) {

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

	var cleanArmadas = function (callback) {
		armadaService.getAll(function (error, allArmadas) {
			for (var i in allArmadas) {
				memberService.getByfleetKey(allArmadas[i].key, function (error, members) {
					if ( ((Date.now() - allArmadas[i].ts) > settings.armadaTtl) && members.length < 1 ) {
						armadaService.removeByKey(allArmadas[i].key, _.noop);
						eventService.removeByfleetKey(allArmadas[i].key, _.noop);
						scanService.removeByfleetKey(allArmadas[i].key, _.noop);
						hostileService.removeByfleetKey(allArmadas[i].key, _.noop);
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
			cleanArmadas();
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
