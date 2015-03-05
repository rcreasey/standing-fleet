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

function log(message) {
  console.log('[' + moment().unix() + '] - ' + message);
}
