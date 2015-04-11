var Server = {

  ajaxGet: function(endpoint, callback) {
    $.ajax({

      url: Data.config.apiUrl + endpoint,
      dataType: 'json',

      success: function (data) {
        setTimeout(function () {
          if (data.success === undefined && data.error === undefined) {
            callback(null, data);
          } else if (data.success) {
            callback(null, data);
          } else {
            callback(data.error, null);
          }
        }, 1000);
      },

      error: function (data, error, errorString) {
        if (error) {
          callback({type: 'net', message: errorString}, null);
        }
      },

    });
  },

  ajaxPost: function(endpoint, data, callback) {
    $.ajax({
      type    : 'POST',
      data    : data,
      url     : Data.config.apiUrl + endpoint,
      dataType  : 'json',

      success: function( data ){
        setTimeout(function () {
          if (data.success) {
            callback(null, data);
          } else {
            callback(data.error, null);
          }
        }, 1000);
      },
      error: function(data, error, errorString){
        if (error) {
          callback({type: 'error', message: errorString}, null);
        }
      }
    });
  },

  listFleets: function(callback) {
    Server.ajaxGet('/fleets/list', callback);
  },

  status: function (callback) {
    Server.ajaxGet('/fleets/status', callback);
    Data.state.lastPollTs = moment().unix();
  },

  joinFleet: function (fleetKey, callback) {
    Server.ajaxGet('/fleets/join/' + fleetKey, callback);
  },

  joinFleetWithPassword: function (fleetKey, fleetPassword, callback) {
    Server.ajaxGet('/fleets/join/' + fleetKey + '/' + fleetPassword, callback);
  },

  eventResponse: function (eventKey, response, callback) {
    Server.ajaxGet('/fleets/respond/' + eventKey + '/' + response, callback);
  },

  poll: function (callback) {
    var lastPoll = Math.round(Data.state.lastPollTs / 5) * 5;

    Server.ajaxGet('/fleets/poll/' + lastPoll, function (error, data) {
      if (error) return callback(error);

      Data.state.lastPollTs = data.ts;
      callback(null, data);
    });
  },

  createFleet: function (fleetName, fleetPassword, callback) {
    Server.ajaxPost('/fleets/create', { fleetName: fleetName, fleetPassword: fleetPassword }, callback);
  },

  leaveFleet: function (callback) {
    Server.ajaxGet('/fleets/leave', callback);
  },

  vicinity: function(callback) {
    if (Data.state.remote_region) {
      Server.ajaxGet('/map/vicinity?regionName=' + Data.state.vicinity.regionName, callback);
    } else {
      Server.ajaxGet('/map/vicinity', callback);      
    }

  },

  wormholes: function(callback) {
    Server.ajaxGet('/map/wormholes', callback);
  },
  
  regions: function(callback) {
    Server.ajaxGet('/map/regions', callback);
  },
  
  systemInformation: function(system_name, callback) {
    Server.ajaxGet('/map/systems/' + system_name, callback);
  },
  
  reports: function(callback) {
    Server.ajaxGet('/reports', callback);
  },
  
  ships: function(callback) {
    Server.ajaxGet('/ships', callback);
  },

  postScan: function (scanData, callback) {
    Server.ajaxPost('/fleets/scan', scanData, callback);
  },

  postStatus: function(statusData, callback) {
    Server.ajaxPost('/fleets/status', statusData , callback);
  },

  postAdvisory: function(advisoryData, callback) {
    Server.ajaxPost('/fleets/advisory', advisoryData , callback);
  },

  postDetails: function(detailsData, callback) {
    Server.ajaxPost('/fleets/details', detailsData, callback);
  },

  postWormholeLinkUpdate: function(from, to, linkData, callback) {
    Server.ajaxPost('/map/jumps/' + from + '/' + to + '/', linkData, callback);
  },

  postWormholeTraversalUpdate: function(from, to, traversalData, callback) {
    Server.ajaxPost('/map/traversals/' + from + '/' + to + '/', traversalData, callback);
  }
};
