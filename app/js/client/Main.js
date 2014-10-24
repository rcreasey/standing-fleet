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

  UI.stopSpin();
  UI.registerEventHandlers();
  UI.unDim();

  log('Begin Polling...')
  pollClipboard();
  pollLogs();
  
  gui.Window.get().show();
};

function pollClipboard() {
  UI.startSpin();
  setTimeout(function() {
    if (Data.state.poll.clipboard) {
      var cb = gui.Clipboard.get();
      var clipboard = document.getElementById('clipboard')
      var event = {'time': Util.getTime(), 'blink': 'clipboard', 'text': cb.get('text')};

      var renderedEvent = $(Templates.event(event))
      Data.ui.clipboard_list.prepend(renderedEvent);
      Data.state.datasources.local.getClient().publish('/events', event);

      UI.stopSpin();
    }

    pollClipboard();

  }, Data.state.poll.loop);
};

function pollLogs() {
  if (Data.state.poll.logs) return;
  
  var log_dir = (/^win/.test(process.platform)) ? Data.state.datasources.logs.path.win : Data.state.datasources.logs.path.darwin;
  var channels = [];
  
  for (channel in Data.state.datasources.logs.channels) {
    if (Data.state.datasources.logs.channels[channel]) channels.push(channel)
  }
  
  if (!channels.length) {
    log('No logs to parse')
    return;
  }
  
  var filename_match = '(' + channels.join('|') + ')_';
  // filename_match += moment.format('YYYYMMDD');
  filename_match += '20130627';
  filename_match += '_\\d+.txt';  

  fs.readdir(log_dir, function(err, list) {
    if(err) throw err;
    var regex = new RegExp(filename_match);
    list.forEach( function(file) {
      if (regex.test(file)) {
        log('Watching ' + file);
        t = new tail.startTailing(path.join(log_dir, file))
        t.on('line', function(line) {
          var event = {'time': Util.getTime(), 'blink': 'logs', 'text': line};

          var renderedEvent = $(Templates.event(event))
          Data.ui.logs_list.prepend(renderedEvent);
          Data.state.datasources.local.getClient().publish('/events', event);
        });

        t.on("error", function(error) {
          log('ERROR: ', error);
        });

        Data.state.datasources.logs.handles.push( t );
      }
    }); 
  });
};

function resetLogPolling() {
  log('Clearing log handles...')
  for (handle in Data.state.datasources.logs.handles) {
    delete handle;
  }
  
  pollLogs();
};

function log(message) {
  if (!Data.config.log) return;
  
  if (Data.config.log === 'events') {
    EventList.addEvent({
      type: 'info',
      text: message
    });

  } else if (Data.config.log === 'console') {
    console.log('[' + moment().unix() + '] - ' + message)
  }
};
