var gui = require('nw.gui')
  , http = require('http')
  , faye = require('faye')
  , moment = require('moment')
  , fs = require('fs')
  , path = require('path')
  , tail = require('file-tail')

window.onload = function () {
  initializeClient();
};

window.onresize = function() {
  UI.update_scrollables();
};

function initializeClient() {
  log('Client Init...');
  Data.ui = Data.build_ui();
  Data.templates = Data.build_templates();

  log('Starting Server...')
  var server = http.createServer()
  Data.state.datasources.local = new faye.NodeAdapter({mount: '/', timeout: 45});

  Data.state.datasources.local.attach(server);
  server.listen(Data.config.local_dataport);

  UI.tabClick('logs');
  UI.stopSpin();
  UI.registerEventHandlers();
  UI.unDim();

  log('Begin Polling...');
  pollClipboard();
  pollLogs();

  gui.Window.get().show();
};

function log(message) {
  if (!Data.config.log) return;
  console.log('[' + moment().unix() + '] - ' + message)
};
