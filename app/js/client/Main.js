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

function pollClipboard() {
  UI.startSpin();
  setTimeout(function() {
    if (Data.state.poll.clipboard) {
      var cb = gui.Clipboard.get();
      var text = cb.get('text');
      if (text) {
        var clipboard = document.getElementById('clipboard')
        var event = {time: Util.getTime(), type: 'sourcedClipboard', data: text};
        cb.clear();

        var renderedEvent = $(Templates.event({time: event.time, text: event.data}));
        Data.ui.clipboard_list.prepend(renderedEvent);
        Data.state.datasources.local.getClient().publish('/events', event);
      }
      UI.stopSpin();
    }

    pollClipboard();

  }, Data.state.poll.loop);
};

function pollLogs() {
  if (!Data.state.poll.logs) return;

  var log_dir = (/^win/.test(process.platform)) ? Data.state.datasources.logs.path.win : Data.state.datasources.logs.path.darwin;
  var channels = [];

  for (channel in Data.state.datasources.logs.channels) {
    if (Data.state.datasources.logs.channels[channel]) channels.push(channel);
  }

  if (!channels.length) {
    log('No logs to parse');
    var renderedEvent = $(Templates.event({'time': Util.getTime(), type: 'error', text: 'No logs to parse.  Have you joined an intel channel today?' }));
    Data.ui.logs_list.prepend(renderedEvent);
    return;
  }

  var filename_match = '(' + channels.join('|') + ')_';
  filename_match += moment().utc().format('YYYYMMDD');
  filename_match += '_\\d+.txt';

  fs.readdir(log_dir, function(err, list) {
    if (err) {
      var renderedEvent = $(Templates.event({'time': Util.getTime(), type: 'error', text: 'Unable to poll logs: ' + err }));
      Data.ui.logs_list.prepend(renderedEvent);
      return;
    }

    var regex = new RegExp(filename_match);
    list.forEach( function(file) {
      if (regex.test(file)) {
        var renderedEvent = $(Templates.event({'time': Util.getTime(), text: 'Watching ' + file }));
        Data.ui.logs_list.prepend(renderedEvent);

        t = new tail.startTailing(path.join(log_dir, file));
        t.on('line', function(line) {
          if (line.length === 1) return;

          Parser.processLine(line, function(event) {
            if (!event) return;

            var renderedEvent = $(Templates.report(event.data));
            Data.ui.logs_list.prepend(renderedEvent);
            Data.state.datasources.local.getClient().publish('/events', event);
          });
        });

        Data.state.datasources.logs.handles.push( t );
      }
    });
  });

  if (Data.state.datasources.logs.handles.length === 0) {
    var renderedEvent = $(Templates.event({'time': Util.getTime(), type: 'error', text: 'No logs to parse.  Have you joined an intel channel today?' }));
    Data.ui.logs_list.prepend(renderedEvent);
    return;
  }

};

function resetLogPolling() {
  log('Clearing log handles...')
  while (Data.state.datasources.logs.handles.length) {
    var handle = Data.state.datasources.logs.handles.pop();
    handle.stop();
    delete handle;
  }

  pollLogs();
};

function log(message) {
  if (!Data.config.log) return;
  console.log('[' + moment().unix() + '] - ' + message)
};
