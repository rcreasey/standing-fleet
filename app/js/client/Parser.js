var etree = require('elementtree')
  , https = require('https')
  , request = require('request')
  , _ = require('lodash')
  , encoding = require('encoding')

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

    // Strip control characters
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
              if (!resolvedCharacters.length) return next();

              requestList.filter(function(c){return c !== sender && characters[c.toUpperCase()] != null;})
                .forEach(function(c){resolvedCharacters[c] = characters[c.toUpperCase()]});

              return next({time: Util.getTime(), type: type, raw: line, data: {clear: clear, type: type,
                reporterId: characters[sender.toUpperCase()], reporterName: sender,
                systemName: system.systemName, systemId: system.systemId,
                pilots: resolvedCharacters}});
            };
            getCharIDs(requestList, getCharIDsComplete);
          }
          else {
            if (!resolvedCharacters.length) return next();
            return next({time: Util.getTime(), type: type, raw: line, data: {clear: clear, type: type,
                  reporterId: characters[sender.toUpperCase()], reporterName: sender,
                  systemName: system.systemName, systemId: system.systemId,
                  pilots: resolvedCharacters}});
          }
        }
        else {
          return next();
        }
      }
    }
    else {
      return next();
    }
  }
};
