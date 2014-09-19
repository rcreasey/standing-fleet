var gui = require('nw.gui')
  , http = require('http')
  , faye = require('faye')
  , moment = require('moment')
  , fs = require('fs')
  , Tail = require('tail').Tail

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

  UI.stopSpin();
  UI.registerEventHandlers();

  log('Begin Polling...')

  pollClipboard();
  gui.Window.get().show();
};

function pollClipboard() {
  UI.startSpin();
  setTimeout(function() {
    var cb = gui.Clipboard.get();
    var clipboard = document.getElementById('clipboard')
    var event = {'time': Util.getTime(), 'text': cb.get('text')};

    var renderedEvent = $(Templates.event(event))
    Data.ui.clipboard_list.prepend(renderedEvent);
    Data.state.datasources.local.getClient().publish('/events', event);

    UI.stopSpin();

    pollClipboard();
  }, 7000);
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
};
