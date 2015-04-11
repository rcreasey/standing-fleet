$(function () {
  UI.registerEventHandlers();
  initialize();

});

function initialize() {
  log('Init...');

  Data.load_wormhole_types();
  WormholeMap.init();
  
  Server.reports(function(error, data) {
    Data.config.maxEvents = 10000;
    $.each(data.reports, function(i, report) {
      
      var event = {type: 'wormhole', 
                  text: '<a href="javascript:CCPEVE.showInfo(5, ' + report.fromSystemId + ')">' + report.fromSystemName + '</a> ' + 
                        ' <i class="fa fa-arrows-h"></i> ' +
                        '<a href="javascript:CCPEVE.showInfo(5, ' + report.toSystemId + ')">' + report.toSystemName + '</a> '};

      if (report.cleared) {
        event.text += ' was cleared';
      } else if (report.type == 'wormhole_updated') {
        event.text += ' was updated';
      } else {
        event.text += ' was discovered';
      }
      
      event.text += ' by <a href="javascript:CCPEVE.showInfo(1377, ' + report.reporterId + ');">' + report.reporterName + '</a>';

      EventList.addEvent(event);
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
                        text: 'Scheulding update for jump from ' +
                              '<a href="javascript:CCPEVE.showInfo(5, ' + from + ')">' + Data.systems[from].name + '</a> ' + 
                              ' to ' +
                              '<a href="javascript:CCPEVE.showInfo(5, ' + to + ')">' + Data.systems[to].name + '</a> '}); 

    $('#link-'+ to + '-' + from).remove();
    $('#link-'+ from + '-' + to).remove();
  });
}

function updateWormholeTraversal(button, from, to) {
  var payload = {};
  
  payload.mass = $('#traversal-mass').val().replace(/,/g, '');
  payload.fleet_name = $('#traversal-fleet').val();
  payload.fc_characterName = $('#traversal-fc').val();
  UIPanels.hidePanel();

  Server.postWormholeTraversalUpdate(from, to, payload, function(error, data) {
    if (error) {
      handleError(error);
      return;
    }
    
    EventList.addEvent({type: 'info', 
                        alert: true, 
                        text: 'Traversal logged for jump from ' +
                              '<a href="javascript:CCPEVE.showInfo(5, ' + from + ')">' + Data.systems[from].name + '</a> ' + 
                              ' to ' +
                              '<a href="javascript:CCPEVE.showInfo(5, ' + to + ')">' + Data.systems[to].name + '</a> '}); 

  });
}

function handleError (error) {
  log(error.message);
  if (error.message) UI.showAlert({
    type: 'error',
    text: error.message
  });
}

function log(message) {
  console.log('[' + moment().unix() + '] - ' + message);
}
