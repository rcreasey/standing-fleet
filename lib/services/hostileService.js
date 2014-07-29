module.exports = function (keyGenerator, storageManager, settings) {

  var pub = {};

  var createHostile = function(headerData, hostile, armadaKey) {
    var hostile = {
      key: keyGenerator.getKey(),
      armadaKey: armadaKey,
      ts: Date.now(),

      reporterId: headerData.id,
      reporterName: headerData.name,
      systemName: headerData.systemName,
      systemId: headerData.systemId,

      id: hostile.id,
      name: hostile.name,

      corporationID: hostile.corporationID,
      corporationName: hostile.corporationName,

      allianceID: hostile.allianceID,
      allianceName: hostile.allianceName,

      shipType: hostile.shipType,
      shipTypeId: hostile.shipTypeId,
      shipName: hostile.shipName,

      isDocked: false
    }

    if (hostile.shipTypeId === undefined && hostile.shipType) hostile.shipTypeId = settings.ships[ hostile.shipType ].id;

    return hostile;
  };

  pub.getNonAttached = function (headerData) {
    return createHostile(headerData, 'none');
  };

  pub.addAndGet = function(headerData, scanData, armadaKey, callback) {
    var hostiles = [];

    for (id in scanData.pilots) {
      var hostile = createHostile(headerData, scanData.pilots[id], armadaKey);

      storageManager.addItem('hostile', hostile, function (error) {
        if (error) return callback(error);
      });

      hostiles.push(hostile);
    }

    callback(null, hostiles);
  };

  pub.updateAndGet = function(headerData, scanData, armadaKey, callback) {
    var hostile = createHostile(headerData, scanData, armadaKey);

    storageManager.updateItem('hostile', hostile.key, hostile, function (error) {
      if (error) return callback(error);
    });

    callback(null, hostile);
  };

  pub.getByKey = function (key, callback) {
    storageManager.getByKey('hostile', key, callback);
  };

  pub.getByArmadaKey = function (armadaKey, callback) {
    storageManager.getByArmadaKey('hostile', armadaKey, callback);
  };

  pub.getAll = function (callback) {
    storageManager.getAll('hostile', callback);
  };

  pub.removeByKey = function (key, callback) {
    storageManager.removeByKey('hostile', key, callback);
  };

  pub.removeBySystemId = function (systemId, callback) {
    storageManager.removeBySystemId('hostile', systemId, callback);
  };

  pub.update = function (key, hostile, callback) {
    storageManager.updateItem('hostile', key, hostile, callback);
  };

  return pub;
};
