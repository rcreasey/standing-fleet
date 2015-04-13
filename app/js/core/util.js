var Util = {

  compareRegion: function( pilot ) {
    try {
      return Data.systems[ pilot.systemId ].regionID === Data.state.vicinity.regionId;      
    } catch(e) {
      return false;
    }
  },
  
  isMe: function(pilot) {
    return Data.state.self.characterId == pilot.characterId;
  },
  
  dedupe: function(list, element, key) {
    var match = $.grep(list, function(e) { return e[key] === element[key] && e.ts.toString().slice(0,-2) === element.ts.toString().slice(0,-2); });
    
    return (match.length > 0) ? true : false;
  },
  
  is_wormhole: function(system) {
    return system.id >= 31000000 && system.id <= 31999999;
  },
  
  isShip: function (shipName) {
    return (typeof Data.ships[shipName] !== 'undefined' && Data.ships[shipName].icons !== undefined);
  },

  getShipType: function (shipName) {
    if (Util.isShip(shipName)){
      return Data.ships[shipName].icons[0];
    }
    return 'other';
  },

  getShipIcon: function (shipName) {
    var returnElement   = $('<div/>');
    
    if (Util.isShip(shipName)){
      for (var i in Data.ships[shipName].class) {
        var file_name = Util.getShipClass(Data.ships[shipName].icons[i]).toLowerCase().replace(/ /gi, '-');
        returnElement.append($('<img src="/images/ship-icons/' + file_name + '.png" title="' + shipName +'" alt="' + shipName + '" />'));
      }
    } else {
      returnElement.append($('<img src="/images/ship-icons/ship-icon-other.gif" title="No Visual" alt="No Visual" />'));
    }

    return $('<div/>').append(returnElement).html();
  },
  
  getShipClass: function (shipName) {
    if (shipName == 'Rookie Ship') return 'Rookie';
    else if (shipName == 'Covert Ops') return 'Frigate';
    else if (shipName == 'Stealth Bomber') return 'Frigate';
    else if (shipName == 'Blockade Runner') return 'Industrial';
    else if (shipName == 'Exhumer') return 'Mining-Barge';
    else if (shipName == 'Logistics') return 'Cruiser';
    else if (shipName == 'Heavy Assault Cruiser') return 'Cruiser';
    else if (shipName == 'Force Recon Ship') return 'Cruiser';
    else if (shipName == 'Combat Recon Ship') return 'Cruiser';
    else if (shipName == 'Combat Battlecruiser') return 'Battlecruiser';
    else if (shipName == 'Marauder') return 'Battleship';
    else return shipName;
  },

  getTime: function () {
    return moment().utc().format('HH:mm:ss');
  },
  
  formatTime: function(ts) {
    return moment(ts).format('HH:mm:ss');
  },
 
  escapeHTML: function (string) {
    return string.replace(/</gi,'&lt;').replace(/>/gi,'&gt;');
  },

  deepClone: function (object) {
    return JSON.parse(JSON.stringify(object));
  },

  getUrlKey: function () {
    var url = window.location.href,
      match = url.match(/[A-z0-9]{17}/);

    return match ? match[0] : false;
  },

  redirectToKeyUrl: function (fleetKey) {
    if (fleetKey !== undefined) {
      window.location = location.protocol
      + '//' + location.hostname
      + (location.port ? ':' + location.port : '')
      + '/' + fleetKey + '/';      
    } else {
      Data.poll = false;
      stopPolling();
      Util.redirectToBasePath();
    }
  },

  redirectToBasePath: function () {
    window.location = location.protocol
      + '//' + location.hostname
      + (location.port ? ':' + location.port : '')
      + '/';
  },

  redirectToJoinPath: function (fleetKey, password) {
    window.location = location.protocol
      + '//' + location.hostname
      + (location.port ? ':' + location.port : '')
      + '/join/' + fleetKey 
      + (password ? '/' + password : '');
  },
  
  redirectToLoginPath: function () {
    window.location = location.protocol
      + '//' + location.hostname
      + (location.port ? ':' + location.port : '')
      + '/login/';
  },

  redirectIfNecessary: function (fleetKey, callback) {
    if (!!fleetKey !== !!Util.getUrlKey() || fleetKey !== Util.getUrlKey()) {
      UIPanels.showLoadingPanel('Redirecting to Standing Fleet URL...', function () {
        Util.redirectToKeyUrl();
      });
    } else {
      callback();
    }
  }
};
