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
	var armadaPassword = $(button).siblings('.armada-password').val();
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
	var armadaKey = $(button).siblings('.armada-key').val();
	joinArmada(armadaKey);
}

function joinArmada(armadaKey) {
	UIPanels.showLoadingPanel('Searching for armada...', function () {
		Server.joinArmada(armadaKey, function(error, data) {
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
	var armadaPassword = $(button).siblings('.armada-password').val();
	submitPassword(armadaPassword);
}

function submitPassword(armadaPassword) {
	var armadaKey = Util.getUrlKey();
	if (!armadaKey) Util.redirectToBasePath();

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
	var scanData = $(button).siblings('.scan-data').val();
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

function submitStatusButtonClick(button) {
	var scanData = $(button).siblings('.status-data').val();
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
	var hostileId = $('#hostile-id').val();
	var hostileName = $('#hostile-name').val();
	var shipTypeId = $('#hostile-ship-type').val();
	var shipName = $('#hostile-ship-name').val();

	submitHostileDetails(hostileId, hostileName, shipTypeId, shipName);
}

function submitHostileDetails(hostileId, hostileName, shipTypeId, shipName) {
	UIPanels.showLoadingPanel('Uploading status...', function () {
		var details = {type: 'hostile', id: hostileId, name: hostileName, shipTypeId: shipTypeId, shipName: shipName};

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
