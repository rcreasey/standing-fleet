var HostileList = {

  clear: function () {
    log('Clearing hostile list...');
    Data.hostiles = [];
    Data.ui.hostiles.empty();
  },

  clearBySystem: function (systemId) {
    log('Clearing system ' + systemId);
    Data.hostiles = $.map(Data.hostiles, function(h) { return h.systemId !== systemId ? h : null; });
    Data.ui.hostiles.empty();
  },

  addHostile: function (hostileToAdd) {
    log('Adding hostile: ' + hostileToAdd.name + '...');
    HostileList.removeHostile(hostileToAdd.id);
    Data.hostiles.push(hostileToAdd);
  },

  removeHostile: function (hostileToRemoveId) {
    var hostileToRemove = HostileList.findHostile(hostileToRemoveId);
    if (hostileToRemove) {
      log('Removing hostile: ' + hostileToRemove.name + '...');
      Data.hostiles.splice(Data.hostiles.indexOf(hostileToRemove), 1);
    }
  },

  findHostile: function (hostileId) {
    for (var index in Data.hostiles) {
      if (Data.hostiles[index].id === hostileId) return Data.hostiles[index];
    }
    return false;
  },

  findHostileElement: function (hostileId) {
    var foundHostileElement = Data.ui.hostiles.find('.hostile-' + hostileId);
    return foundHostileElement || false;
  },

  renderSingleHostile: function (hostile) {
    log('Rendering hostile: ' + hostile.name + ' (single)...');
    HostileList.addUiProperties(hostile);
    var existingHostileElement = Data.ui.hostiles.find('#hostile-' + hostile.id);
    if (existingHostileElement.length) {
      existingHostileElement.after($(hostile.html)).remove();
    } else {
      Data.ui.hostiles.append($(hostile.html));
    }
  },

  sortAndRenderAll: function () {
    log('Sorting and rendering all hostiles...');

    Data.hostiles.sort(function (hostile1, hostile2) {
      if (hostile1[Data.state.hostileSortOrder.property] < hostile2[Data.state.hostileSortOrder.property]) {
        return Data.state.hostileSortOrder.order === 'asc' ? -1 : 1;
      } if (hostile1[Data.state.hostileSortOrder.property] > hostile2[Data.state.hostileSortOrder.property]) {
        return Data.state.hostileSortOrder.order === 'asc' ? 1 : -1;
      } else {
        return 0;
      }
    });

    Data.ui.hostiles.empty();
    Data.hostiles.forEach(function (hostile) {
      log('Rendering hostile: ' + hostile.name + ' (batch)...');
      HostileList.addUiProperties(hostile);
      Data.ui.hostiles.append($(hostile.html));
    });
  },

  addUiProperties: function (hostile) {
    hostile.reported_at = moment(hostile.ts).utc().format('HH:mm:ss')
    hostile.shipIcon = Util.getShipIcon(hostile.shipType);
    hostile.html = Data.templates.hostile(hostile);
  }
};