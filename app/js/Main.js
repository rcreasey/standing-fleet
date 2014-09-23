$(function () {
	UI.registerEventHandlers();
	initialize();

	try {
		Data.state.data_client = new Faye.Client(Data.config.data_client);
		Data.state.data_client.subscribe('/events', function(event) {
			EventList.addEvent(event);
		});
	} catch(err) {
		console.log('Unable to connect to local data client...')
	}

});

function initialize() {
	log('Init...');

	stopPolling();

	MemberList.clear();
	HostileList.clear();
	EventList.clear();
	ScanList.clear();

	Data.preload();

	UIPanels.showLoadingPanel(false, function () {
		Server.status(function(error, data) {
			if (error) {
				handleError(error);

				if (error.type == 'igb-headers') {
					Util.redirectToLoginPath();
				} else {
					UIPanels.showStartPanel(error);
				}

				if (error.type === 'trust') {
					CCPEVE.requestTrust(location.protocol + '//' + location.hostname);
				}

				return;
			}

			EventHandler.dispatchEvents(data.events);

			if (Data.state.fleet.key) {
				EventList.addEvent({ type: 'youJoined', text: 'You opened this standing fleet', alert: false });

				Util.redirectIfNecessary(Data.state.fleet.key, function () {
					UIPanels.hidePanel(pollLoop);
				});

			} else {
				if (Util.getUrlKey()) {
					joinFleet(Util.getUrlKey());
				} else {
					UIPanels.showStartPanel();
				}
			}
		});
	})
}

function createFleetButtonClick(button) {
	var fleetPassword = $('#create-fleet-password').val();
	createFleet(fleetPassword);
}

function createFleet(fleetPassword) {
	UIPanels.showLoadingPanel('Creating new fleet...', function () {
		Server.createFleet(fleetPassword, function(error, data) {
			if (error) {
				UIPanels.showCreatePanel(error);
				return;
			}

			initialize();
		});
	});
}

function joinFleetButtonClick(button) {
	var fleetKey = $('#join-fleet-key').val();
	joinFleet(fleetKey);
}

function joinFleet(fleetKey) {
	UIPanels.showLoadingPanel('Searching for fleet...', function () {
		Server.joinFleet(fleetKey, function(error, data) {
			Data.state.fleet.key = fleetKey;
			if (error) {
				if (error.type === 'password') UIPanels.showPasswordPanel();
				else UIPanels.showJoinPanel(error);
				return;
			}

			initialize();
		});
	});
}

function submitPasswordButtonClick(button) {
	var fleetPassword = $('#join-fleet-password').val();
	submitPassword(fleetPassword);
}

function submitPassword(fleetPassword) {
	var fleetKey = Util.getUrlKey();
	if (!fleetKey) fleetKey = Data.state.fleet.key;

	UIPanels.showLoadingPanel('Authenticating...', function () {
		Server.joinFleetWithPassword(fleetKey, fleetPassword, function (error, data) {
			if (error) {
				if (error.type === 'password') UIPanels.showPasswordPanel(error);
				else UIPanels.showJoinPanel(error);
				return;
			}

			initialize();
		});
	});
}

function submitScanButtonClick(button) {
	var scanData = $('#scan-data').val();
	submitScan(scanData);
}

function submitScan(scanData) {
	UIPanels.showLoadingPanel('Uploading scan...', function () {
		var parsedScanData = ScanList.parse(scanData);

		Server.postScan(parsedScanData, function(error, data) {
			UIPanels.hidePanel(function () {
				if (error) {
					handleError(error);
					return;
				}

				EventList.addEvent({ type: 'info', text: 'Scan was uploaded...', alert: true });
			});
		});
	});
}

function scanFilter(button, filter) {
	var results = $(button).closest('.scan').find('.type-classes .result')
	$(button).closest('ul').find('.btn').removeClass('active');
	results.removeClass('selected');

	$(button).addClass('active');
	$.each(results, function(i, result) {
		if ($(result).find('.details-container .distance:contains("-")').length) {
			if (filter === 'offgrid') $(result).addClass('selected');
		} else {
			if (filter === 'grid') $(result).addClass('selected');
		}
	})
}

function submitStatusButtonClick(button) {
	var scanData = $('#status-data').val();
	submitStatus("validate", scanData);
}

function submitStatus(reported_status, pilots) {
	UIPanels.showLoadingPanel('Uploading status...', function () {
		var status = ScanList.addStatus(reported_status, pilots);

		Server.postStatus(status, function(error, data) {
			UIPanels.hidePanel(function () {
				if (error) {
					handleError(error);
					return;
				}

				EventList.addEvent({ type: 'info', class: status.text,
														 text: 'Status was reported on <strong>' +
        													 '<a href="javascript:CCPEVE.showInfo(5, ' + status.systemId + ')">' +
																	 status.systemName + '</a> by you.' });
			});
		});
	});
}

function submitHostileDetailsClick(button) {
	var key = $('#hostile-key').val();
	var id = $('#hostile-id').val();
	var name = $('#hostile-name').val();
	var shipType = $('#hostile-ship-type').val();
	var shipName = $('#hostile-ship-name').val();

	submitHostileDetails(key, id, name, shipType, shipName);
}

function submitHostileDetails(key, id, name, shipType, shipName) {
	UIPanels.showLoadingPanel('Uploading status...', function () {
		var details = {type: 'hostile', key: key, id: id, name: name, shipType: shipType, shipName: shipName};

		Server.postDetails(details, function(error, data) {
			UIPanels.hidePanel(function () {
				if (error) {
					handleError(error);
					return;
				}

				EventList.addEvent({ type: 'info', class: status.text,
														text: 'Details were reported on <strong>' +
																	'<a href="javascript:CCPEVE.showInfo(1377, ' + details.id + ')">' +
																	details.name + '</a> by you.' });
			});
		});
	});
}

function leaveFleet() {
	UIPanels.showLoadingPanel('Leaving Standing Fleet...', function () {
		Server.leaveFleet(function(error, data) {
			if (error) {
				handleError(error);
				UIPanels.hidePanel();
				return;
			}

			Util.redirectToBasePath();
		});
	});
}

function pollLoop() {
	UI.startSpin();
	Data.state.pollLoop = setTimeout(function() {
		Server.poll(function (error, data) {
			if (error) return handleError(error);

			EventHandler.dispatchEvents(data.events);
			UI.stopSpin();
		});

		pollLoop();
	}, Data.config.pollInterval);
}

function stopPolling() {
	clearTimeout(Data.state.pollLoop);
}

function handleError (error) {
	log(error.message);
	if (error.stopPoll) Data.poll = false;
	if (error.message) UI.showAlert({
		type: 'error',
		text: error.message
	});
}

function log(message) {
	if (!Data.config.log) return;

	if (Data.config.log === 'events') {
		EventList.addEvent({
			type: 'info',
			text: message
		});

	} else if (Data.config.log === 'console') {
		console.log('[' + Date.now() + '] - ' + message)
	}
}

$( window ).resize(function() {
	UI.update_scrollables();
});
