$(function () {
  UI.registerEventHandlers();
  initialize();

});

function initialize() {
  log('Init...');

  Data.load_wormhole_types();
  Server.wormholes(function(error, data) {
    Data.state.vicinity = data.current;
    Data.regions = data.regions;
    Data.systems = data.systems;
    Data.jumps   = data.jumps;

    WormholeMap.init();
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

function log(message) {
  console.log('[' + moment().unix() + '] - ' + message);
}
