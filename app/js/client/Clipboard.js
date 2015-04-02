var clipboard = require('clipboard');

function pollClipboard() {
  UI.startSpin();
  setTimeout(function() {
    if (Data.state.poll.clipboard) {
      var text = clipboard.readText('text');
      if (text) {
        var clipboard = document.getElementById('clipboard')
        var event = {time: Util.getTime(), type: 'sourcedClipboard', data: text};
        clipboard.clear();

        var renderedEvent = $(Templates.event({time: event.time, text: event.data}));
        Data.ui.clipboard_list.prepend(renderedEvent);
        Data.state.datasources.local.getClient().publish('/events', event);
      }
      UI.stopSpin();
    }

    pollClipboard();

  }, Data.state.poll.loop);
};
