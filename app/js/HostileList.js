var HostileList = {

  clear: function () {
    // log('Clearing hostile list...');
    Data.hostiles = [];
    Data.ui.hostiles_list.empty();
  },

  clearBySystem: function (systemId) {
    // log('Clearing system ' + systemId);
    Data.hostiles = $.map(Data.hostiles, function(h) { return h.systemId !== +systemId ? h : null; });
    Data.ui.hostiles_list.empty();
  },

  addHostile: function (hostile) {
    // log('Adding hostile: ' + hostile.characterName + '...');
    if (!Util.compareRegion(hostile)) return;      
    HostileList.removeHostile(hostile.characterId);
    Data.hostiles.push(hostile);
  },

  fadeHostile: function (hostileToFadeId) {
    var hostileToFade = HostileList.findHostile(hostileToFadeId);
    if (hostileToFade) {
      // log('Fading hostile: ' + hostileToFade.characterName + '...');
      hostileToFade.is_faded = true;
    }
  },
  
  removeHostile: function (hostileToRemoveId) {
    var hostileToRemove = HostileList.findHostile(hostileToRemoveId);
    if (hostileToRemove) {
      // log('Removing hostile: ' + hostileToRemove.characterName + '...');
      Data.hostiles.splice(Data.hostiles.indexOf(hostileToRemove), 1);
    }
  },

  findHostile: function (hostileId) {
    for (var index in Data.hostiles) {
      if (Data.hostiles[index].characterId === +hostileId) return Data.hostiles[index];
    }
    return false;
  },

  findHostileElement: function (hostileId) {
    var foundHostileElement = Data.ui.hostiles_list.find('.hostile-' + hostileId);
    return foundHostileElement || false;
  },

  renderSingleHostile: function (hostile) {
    // log('Rendering hostile: ' + hostile.characterName + ' (single)...');
    if (!Util.compareRegion(hostile)) return;
    HostileList.addUiProperties(hostile);
    var existingHostileElement = Data.ui.hostiles_list.find('#hostile-' + hostile.characterId);
    if (existingHostileElement.length) {
      existingHostileElement.after($(hostile.html)).remove();
    } else {
      Data.ui.hostiles_list.append($(hostile.html));
    }
  },

  sortAndRenderAll: function () {
    // log('Sorting and rendering all hostiles...');

    Data.hostiles.sort(function (hostile1, hostile2) {
      if (hostile1[Data.state.hostileSortOrder.property] < hostile2[Data.state.hostileSortOrder.property]) {
        return Data.state.hostileSortOrder.order === 'asc' ? -1 : 1;
      } if (hostile1[Data.state.hostileSortOrder.property] > hostile2[Data.state.hostileSortOrder.property]) {
        return Data.state.hostileSortOrder.order === 'asc' ? 1 : -1;
      } else {
        return 0;
      }
    });

    Data.ui.hostiles_list.empty();
    Data.hostiles.forEach(function (hostile) {
      // log('Rendering hostile: ' + hostile.characterName + ' (batch)...');
      if (!Util.compareRegion(hostile)) return;
      HostileList.addUiProperties(hostile);
      Data.ui.hostiles_list.append($(hostile.html));
    });

    UI.update_scrollables();
  },
  
  addUiProperties: function (hostile) {
    hostile.reported_at = moment(hostile.ts).utc().format('HH:mm:ss')
    hostile.shipIcon = Util.getShipIcon(hostile.shipType);
    hostile.html = Data.templates.hostile(hostile);
  }
};
