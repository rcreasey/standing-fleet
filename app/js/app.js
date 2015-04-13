$(function () {
  UI.registerEventHandlers();
  initialize();

  try {
    Data.state.data_client = new Faye.Client(Data.config.data_client.url);
    Data.state.data_client.subscribe('/events', function(event) {
      EventHandler.dispatchEvents([event]);
    });
    Data.config.data_client.connected = true;
    log('Connected to local data client...');
  } catch(err) {
    log('Unable to connect to local data client...');
  }
  
  UI.data_client_check();
});

function initialize() {
  log('Init...');

  stopPolling();

  MemberList.clear();
  HostileList.clear();
  EventList.clear();
  ScanList.clear();
  
  Data.load_ships();
  Data.load_wormhole_types();

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

      Data.populate(function() {
        SystemMap.init();
        EventHandler.dispatchEvents(data.events);
      });

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
  var name = $('#create-fleet-name').val();
  var password = $('#create-fleet-password').val();
  var description = $('#create-fleet-description').val();

  UIPanels.showLoadingPanel('Creating new fleet...', function () {
    Server.createFleet(name, password, description, function(error, data) {
      if (error) {
        UIPanels.showCreatePanel(error);
        return;
      }
      console.log(data);
      
      Util.redirectToJoinPath(data.events.key, data.events.password);
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

      Util.redirectToJoinPath(data.events.key);
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

      Util.redirectToJoinPath(fleetKey, fleetPassword);
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

function submitSourcedStatus(status) {
  Server.postStatus(status, function(error, data) {
    if (error) {
      handleError(error);
      return;
    }

    EventList.addEvent({ type: 'info', class: status.text,
                        text: 'Status was reported on <strong>' +
                              '<a href="javascript:CCPEVE.showInfo(5, ' + status.systemId + ')">' +
                              status.systemName + '</a> from your desktop client.' });
  });

}

function submitHostileDetailsClick(button) {
  var hostile = {'key': $('#hostile-key').val(),
                 'type': 'hostile',
                 'characterId': $('#hostile-id').val(),
                 'characterName': $('#hostile-name').val(),
                 'shipType': $('#hostile-ship-type').val(),
                 'systemName': $('#hostile-system-name').val(),
                 'systemId': $('#hostile-system-id').val(),
                 'is_docked': $('#hostile-is-docked').is(':checked')
  }

  submitHostileDetails(hostile);
}

function submitHostileDetails(hostile) {
  UIPanels.showLoadingPanel('Uploading status...', function () {

    Server.postDetails(hostile, function(error, data) {
      UIPanels.hidePanel(function () {
        if (error) {
          handleError(error);
          return;
        }

        EventList.addEvent({ type: 'info', class: status.text,
                            text: 'Details were reported on <strong>' +
                                  '<a href="javascript:CCPEVE.showInfo(1377, ' + hostile.characterId + ')">' +
                                  hostile.characterName + '</a> by you.' });
      });
    });
  });
}

function reportAdvisory(button, systemId, type) {
  var state = ! $( button ).hasClass('present');
  var advisory = {systemId: systemId, type: type, state: state};
  
  $(button).removeAttr('onclick');
  
  Server.postAdvisory(advisory, function(error, data) {
    if (error) {
      handleError(error);
      return;
    }
    
    EventList.addEvent({type: 'info', alert: true, text: 'Advisory reported on ' +
                                            '<a href="javascript:CCPEVE.showInfo(5, ' + systemId + ')">' +
                                            Data.systems[systemId].name + '</a> by you.' 
    });
  });
}

function updateWormholeLink(button, from, to, data) {
  var payload = {};

  if (!data) {
    payload.sig_a = $('#sig-a').val();
    payload.sig_b = $('#sig-b').val();
    payload.type_a = $('#type-a').val();
    payload.type_b = $('#type-b').val();
    payload.info = $('#wormhole-info').val();
    UIPanels.hidePanel();
  } else {
    payload.info = data;
  }

  Server.postWormholeLinkUpdate(from, to, payload, function(error, data) {
    if (error) {
      handleError(error);
      return;
    }
    
    EventList.addEvent({type: 'info', 
                        alert: true, 
                        text: 'Wormhole jump from ' +
                              '<a href="javascript:CCPEVE.showInfo(5, ' + from + ')">' + Data.systems[from].name + '</a> ' + 
                              ' to ' +
                              '<a href="javascript:CCPEVE.showInfo(5, ' + to + ')">' + Data.systems[to].name + '</a> ' + 
                              ' updated by you.'});    
  });
}

function leaveFleet() {
  UIPanels.showLoadingPanel('Leaving Standing Fleet...', function () {
    Server.leaveFleet(function(error, data) {
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
  if (error.stopPoll) {
    Data.poll = false;
    stopPolling();
  }
  if (error.message) UI.showAlert({
    type: 'error',
    text: error.message
  });
}

function log(message) {
  if (!Data.config.log) { return; }

  if (Data.config.log === 'events') {
    EventList.addEvent({
      type: 'info',
      text: JSON.stringify(message)
    });

  } else if (Data.config.log === 'console') {
    console.log('[' + moment().unix() + '] - ' + JSON.stringify(message));
  }
}

$( window ).resize(function() {
  UI.update_scrollables();
});
