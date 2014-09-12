var gui = require('nw.gui')
  , moment = require('moment')

function startSpinner() { $('#bottom-menu-spinner').fadeIn(1500); }
function stopSpinner() { $('#bottom-menu-spinner').fadeOut(1500); }

function pollClipboard() {
  startSpinner();
  setTimeout(function() {
    var cb = gui.Clipboard.get();
    var clipboard = document.getElementById('clipboard')
    var event = {'type': 'report', 'time': moment().utc().format('HH:mm:ss'), 'text': cb.get('text')};

    var renderedEvent = $(Templates.event(event))
    $('#clipboard').prepend(renderedEvent);
    stopSpinner();

    pollClipboard();
  }, 10000);
}

window.onload = function() {
  stopSpinner();
  pollClipboard();
  gui.Window.get().show();
}
