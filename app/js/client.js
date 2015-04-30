var app = require('app')
  , BrowserWindow = require('browser-window')
  , path = require('path');

require('crash-reporter').start();

var mainWindow = null;

app.on('window-all-closed', function() {
  app.quit();
});

app.on('ready', function() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 450
  });

  // mainWindow.openDevTools({detach: true});
  mainWindow.loadUrl(path.join('file://', __dirname, '../index.html'));
  mainWindow.on('closed', function() { mainWindow = null; });
});
