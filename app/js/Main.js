$(function () {
	UI.registerEventHandlers();
	initialize();
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
				UIPanels.showJoinPanel(error);

				if (error.type === 'trust') {
					CCPEVE.requestTrust(location.protocol + '//' + location.hostname);
				}

				return;
			}

			EventHandler.dispatchEvents(data.events);

			if (Data.state.armada.key) {
				EventList.addEvent({ type: 'youJoined', text: 'You opened this standing fleet', alert: false });

				Util.redirectIfNecessary(Data.state.armada.key, function () {
					UIPanels.hidePanel(pollLoop);
				});

			} else {
				if (Util.getUrlKey()) {
					joinArmada(Util.getUrlKey());
				} else {
					UIPanels.showJoinPanel();
				}
			}
		});
	})
}

function createArmadaButtonClick(button) {
	var armadaPassword = $('#create-fleet-password').val();
	createArmada(armadaPassword);
}

function createArmada(armadaPassword) {
	UIPanels.showLoadingPanel('Creating new armada...', function () {
		Server.createArmada(armadaPassword, function(error, data) {
			if (error) {
				UIPanels.showCreatePanel(error);
				return;
			}

			initialize();
		});
	});
}

function joinArmadaButtonClick(button) {
	var armadaKey = $('#join-fleet-key').val();
	joinArmada(armadaKey);
}

function joinArmada(armadaKey) {
	UIPanels.showLoadingPanel('Searching for fleet...', function () {
		Server.joinArmada(armadaKey, function(error, data) {
			Data.state.armada.key = armadaKey;
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
	var armadaPassword = $('#join-fleet-password').val();
	submitPassword(armadaPassword);
}

function submitPassword(armadaPassword) {
	var armadaKey = Util.getUrlKey();
	if (!armadaKey) armadaKey = Data.state.armada.key;

	UIPanels.showLoadingPanel('Authenticating...', function () {
		Server.joinArmadaWithPassword(armadaKey, armadaPassword, function (error, data) {
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

function leaveArmada() {
	UIPanels.showLoadingPanel('Leaving Standing Fleet...', function () {
		Server.leaveArmada(function(error, data) {
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
