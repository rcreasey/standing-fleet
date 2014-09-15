var gui = require('nw.gui')
  , moment = require('moment')
  , fs = require('fs')
  , Tail = require('tail').Tail

function startSpinner() { $('#bottom-menu-spinner').fadeIn(1500); }
function stopSpinner() { $('#bottom-menu-spinner').fadeOut(1500); }

function pollClipboard() {
  startSpinner();
  setTimeout(function() {
    var cb = gui.Clipboard.get();
    var clipboard = document.getElementById('clipboard')
    var event = {'type': 'clipboard', 'time': moment().utc().format('HH:mm:ss'), 'text': cb.get('text')};

    var renderedEvent = $(Templates.event(event))
    $('#clipboard').prepend(renderedEvent);
    stopSpinner();

    pollClipboard();
  }, 10000);
}

function tailLogs() {
  if (process.platform === 'win32') {
    var path = '%userprofile%\\documents\\EVE\\logs\\Chatlogs\\'
  } else {
    var path = '/Users/rcreasey/Library/Application\ Support/EVE\ Online/p_drive/User/My\ Documents/EVE/logs/Chatlogs/'
  }

  console.log( path )
  var logs = fs.readdirSync(path)
               .map(function(v) {
                 return { name:v,
                          time:fs.statSync(path + v).mtime.getTime()
                        };
               })
               .sort(function(a, b) { return a.time - b.time; })
               .map(function(v) { return v.name; } );

  console.log( logs )


  // var tail = new Tail( path + filename );
  // tail.on('line', function(data) {
  //   startSpinner();
  //   var event = {'type': 'log', 'time': moment().utc().format('HH:mm:ss'), 'text': data};
  //   var renderedEvent = $(Templates.event(event))
  //   $('#clipboard').prepend(renderedEvent);
  //
  //   stopSpinner();
  // });
}

window.onload = function() {
  stopSpinner();
  pollClipboard();
  tailLogs();
  gui.Window.get().show();
}
