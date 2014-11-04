var gui = require('nw.gui')
  , http = require('http')
  , faye = require('faye')
  , moment = require('moment')
  , fs = require('fs')
  , path = require('path')
  , tail = require('file-tail')
  , etree = require('elementtree')
  , https = require('https')
  , request = require('request')
  , _ = require('lodash')
  , encoding = require('encoding')
  // , stripcc = require('stripcc')

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
  filename_match += moment().format('YYYYMMDD');
  //filename_match += '20130627';
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

  if (Data.config.log === 'events') {
    EventList.addEvent({
      type: 'info',
      text: message
    });

  } else if (Data.config.log === 'console') {
    console.log('[' + moment().unix() + '] - ' + message)
  }
};

var Dict = function() {
  "use strict";
  this._root = {};
};

Dict.prototype = {
  /**
   * @param {string} word
   */
  add: function add(word) {
    var i, char, node = this._root, uword;
    if( !(typeof word === 'string' || word instanceof String) ) {
      throw new TypeError("word is not string");
    }
    uword = word.toUpperCase();
    // Assert start position with a space character
    node = node[" "] || (node[" "] = {_parent: node});
    for( i = 0 ; i < uword.length; i++ ) {
      char = uword.charAt(i);
      node = node[char] || (node[char] = {_parent: node});
    }
    node._result = word;
  },
  compile: function compile() {
    var queue = [], entry, node, child, fall;

    queue.push(this._root);
    while( queue.length > 0 ) {
      node = queue.shift();
      delete node._fall;
      var keys = Object.keys(node);
      for( var i = 0 ; i < keys.length; i++ ) {
        var key = keys[i];
        if(key.length > 1) {
          continue;
        }
        queue.push(node[key]);
      }
    }

    this._root._fall = this._root;
    queue.push({char: null, node: this._root});
    while( queue.length > 0 ) {
      entry = queue.shift();
      node = entry.node;
      var keys = Object.keys(node);
      for( var i = 0 ; i < keys.length; i++ ) {
        var key = keys[i];
        if(key.length > 1) {
          continue;
        }
        var char = key;
        child = node[key];
        queue.push({char: char, node: child});
      }
      if( node === this._root ) {
        continue;
      }
      fall = node._parent._fall;
      while( fall[entry.char] === undefined && fall !== this._root ) {
        fall = fall._fall;
      }
      node._fall = fall[entry.char] || this._root;
      if( node._fall === node ) {
        node._fall = this._root;
      }
    }
  },
  search: function search(text) {
    var result = [], state = this._root, node, i, self=this;
    if( !(typeof text === 'string' || text instanceof String) ) {
      throw new TypeError("word is not string");
    }
    text = text.toUpperCase();
    var step = function search_step(char) {
      node = state;
      while( node[char] === undefined && node !== self._root ) {
        node = node._fall;
      }
      if( node === self._root ) {
        node = node[char] || self._root;
      }
      else {
        node = node[char];
      }
      state = node;
      while( node !== self._root ) {
        if( node._result ) {
          result.push(node._result);
        }
        node = node._fall;
      }
    };
    step(" ");
    for( i = 0 ; i < text.length ; i++ ) {
      step(text.charAt(i));
    }
    return result;
  }
};

var getCharIDs = function getCharIDs(characterList, next) {
  https.get('https://api.eveonline.com/Eve/CharacterID.xml.aspx?names=' + characterList.join(","), function(response){
    var result = '';
    response.on('data', function(chunk){result += chunk;});
    response.on('end', function() {
      var xml = etree.parse(result);
      xml.findall('./result/rowset/row').map(function(row) {
        if( characters[row.attrib.name.toUpperCase()] !== undefined ) {
          return;
        }
        var charID = parseInt(row.attrib.characterID);
        if( charID !== 0 ){
          characters[row.attrib.name.toUpperCase()] = charID;
          charDict.add(row.attrib.name);
        }
        else {
          characters[row.attrib.name.toUpperCase()] = null;
        }
      });
      charDict.compile();
      next();
    });
  });
};

var system_list;
request({url: Data.config.domain + '/data/map.json', json: true}, function (error, response, body) {
  if (error) console.log(error);
  system_list = body.Systems;
});

var lineRegex = /\[ (\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2}) \] ([\w ]+) > (.*)/i;
var killmailRegex = /Kill: (.*) \((.*)\)/i;
var characters = Object.create(null);
var charDict = new Dict();

var processLine = function processLine(line, next) {
  if(line != undefined) {

    // wtf are these? ��
    var buffer = encoding.convert(line, 'utf-16');
    var result = lineRegex.exec(buffer.slice(7).toString().replace(/\0/g,''));

    if(result) {
      var timestamp = result[1];
      var sender = result[2];
      var text = result[3];
      var requestList = [];
      var resolvedCharacters = {};
      var clear = false;

      if( sender === 'EVE System') {
        next();
        return;
      }

      if(characters[sender.toUpperCase()] === undefined) {
        requestList.push(sender);
      }

      var killmailResult = killmailRegex.exec(line);
      if(killmailResult) {
        var deadCharacter = killmailResult[1];
        var lostShip = killmailResult[2];
        requestList.push(deadCharacter);

        var getCharIDsComplete = function getCharIDsComplete() {
          next({time: Util.getTime(), raw: line, type: 'sourcedKillmail',
                data: { type: 'sourcedKillmail', reporterId: characters[sender.toUpperCase()], reporterName: sender,
                pilots: {deadCharacter: characters[deadCharacter.toUpperCase()]}, lostShip: lostShip}});
        };
        if(requestList.length > 0) {
          getCharIDs(requestList, getCharIDsComplete);
        }
        else {
          getCharIDsComplete();
        }
      }
      else {
        var split = text.split("  ");
        var system;

        split.forEach(function (element) {
          var matched_system = _.find(system_list, function(s) {
            var r = new RegExp(s.name, 'i');
            return r.test(element);
          });

          if(matched_system !== undefined) {
            system = {systemName: matched_system.name, systemId: matched_system.id, regionId: matched_system.regionID};
            if (element.toUpperCase() === system.systemName.toUpperCase()) return;
          }

          if(characters[element.toUpperCase()] === undefined) {
            var searchResult = charDict.search(element).sort(function(a,b){return b.length - a.length}).shift();
            if( searchResult !== undefined && characters[searchResult.toUpperCase()] !== null ) {
              resolvedCharacters[searchResult] = characters[searchResult.toUpperCase()];
            }
            else if( /(clear|clr|empty)/.test(element) ) {
              clear = true;
            }
            else if( /^[A-Za-z0-9\-\_\' ]+$/.test(element) ) {
              requestList.push(element);
            }
          }
          else if( characters[element.toUpperCase()] !== null ) {
            resolvedCharacters[element] = characters[element.toUpperCase()];
          }
        });

        if( system ) {
          var type = (clear) ? 'sourcedClear' : 'sourcedHostile';
          if( requestList.length > 0 ) {
            var getCharIDsComplete = function getCharIDsComplete() {
              requestList.filter(function(c){return c !== sender && characters[c.toUpperCase()] != null;})
                .forEach(function(c){resolvedCharacters[c] = characters[c.toUpperCase()]});
              next({time: Util.getTime(), type: type, raw: line, data: {clear: clear, type: type,
                reporterId: characters[sender.toUpperCase()], reporterName: sender,
                systemName: system.systemName, systemId: system.systemId,
                pilots: resolvedCharacters}});
            };
            getCharIDs(requestList, getCharIDsComplete);
          }
          else {
            next({time: Util.getTime(), type: type, raw: line, data: {clear: clear, type: type,
                  reporterId: characters[sender.toUpperCase()], reporterName: sender,
                  systemName: system.systemName, systemId: system.systemId,
                  pilots: resolvedCharacters}});
          }
        }
        else {
          next();
        }
      }
    }
    else {
      next();
    }
  }
};
