module.exports = function (keyGenerator, storageManager) {

  var pub = {};

  var createHostile = function(headerData, hostile, armadaKey) {
    return {
      key: keyGenerator.getKey(),
      armadaKey: armadaKey,
      ts: Date.now(),

      reporterId: headerData.id,
      reporterName: headerData.name,
      systemName: headerData.systemName,
      systemId: headerData.systemId,

      id: hostile.id,
      name: hostile.name,

      shipType: hostile.shipType,
      shipTypeId: hostile.shipTypeId,
      shipName: hostile.shipName,

      isDocked: false
    }
  };

  pub.getNonAttached = function (headerData) {
    return createHostile(headerData, 'none');
  };

  pub.addAndGet = function(headerData, scanData, armadaKey, callback) {
    var hostiles = [];

    for (id in scanData.hostiles) {
      var hostile = createHostile(headerData, scanData.hostiles[id], armadaKey);
      storageManager.addItem('hostile', hostile, function (error) {
        if (error) return callback(error);
      });

      hostiles.push(hostile);
    }

    callback(null, hostiles);
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

  pub.removeBySystem = function (systemId, callback) {
    storageManager.removeByKey('hostile', systemId, callback);
  };

  pub.update = function (key, hostile, callback) {
    storageManager.updateItem('hostile', key, hostile, callback);
  };

  return pub;
};
