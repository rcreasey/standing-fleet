var root = require('path').normalize(__dirname + '/../..')
  , Hostile = require(root + '/models/hostile')

module.exports = function (keyGenerator, settings) {

  var pub = {};

  var createHostile = function(headerData, hostile, fleetKey) {
    var hostile = new Hostile({
      key: hostile.key || keyGenerator.getKey(),
      fleetKey: fleetKey,

      reporterId: headerData.id,
      reporterName: headerData.name,
      systemName: headerData.systemName,
      systemId: headerData.systemId,

      characterId: hostile.id,
      characterName: hostile.name,

      corporationID: hostile.corporationID,
      corporationName: hostile.corporationName,

      allianceID: hostile.allianceID,
      allianceName: hostile.allianceName,

      shipType: hostile.shipType,
      shipTypeId: hostile.shipTypeId,
      shipName: hostile.shipName,

      isDocked: false
    });

    if ((hostile.shipTypeId === null || hostile.shipTypeId === undefined) && hostile.shipType) {
      hostile.shipTypeId = settings.ships[ hostile.shipType ].id;
    }

    return hostile;
  };

  pub.getNonAttached = function (headerData) {
    return createHostile(headerData, 'none');
  };

  pub.addAndGet = function(headerData, scanData, fleetKey, callback) {
    hostileService.updateAndGet(headerData, scanData, fleetKey, callback);
  };

  pub.updateAndGet = function(headerData, scanData, fleetKey, callback) {
    var hostile = createHostile(headerData, scanData, fleetKey);

    hostile.save(function(error) {
      if (error) return callback(error);

      callback(null, hostile);
    });
  };

  pub.getById = function (id, callback) {
    Hostile.findOne({id: id}, callback);
  };

  pub.getByKey = function (key, callback) {
    Hostile.findOne({key: key}, callback);
  };

  pub.getByfleetKey = function (fleetKey, callback) {
    Hostile.find({fleetKey: fleetKey}, callback);
  };

  pub.getAll = function (callback) {
    Hostile.find({}, callback);
  };

  pub.removeByKey = function (key, callback) {
    Hostile.remove({key: key}, callback);
  };

  pub.removeBySystemId = function (systemId, callback) {
    Hostile.remove({systemId: systemId}, callback);
  };

  pub.removeByfleetKey = function (fleetKey, callback) {
    Hostile.remove({fleetKey: fleetKey}, callback);
  };

  pub.update = function (key, hostile, callback) {
    Hostile.update({key: key}, hostile, { upsert: true, multi: true }, callback);
  };

  return pub;
};
