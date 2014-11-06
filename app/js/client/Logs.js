var fs = require('fs')
  , path = require('path')
  , tail = require('file-tail')

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

          processLine(line, function(event) {
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
