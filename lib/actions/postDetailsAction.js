module.exports = function (hostileService, eventService, headerParser, errorResponse, successResponse, async, logger, settings, _) {

  var pub = {};

  var checkDetailsDataIntegrity = function (details) {
    if (!typeof(details) === 'object'
      || !details.type
      || !details.key
      || !details.characterId
      || !details.characterName
      || (!details.shipType && !details.shipName) ) {
      return false;
    }

    if (!settings.ships[ details.shipType ]) return false;

    return true;
  };

  pub.run = function (req, res) {
    logger.processing(req);

    var pilot = req.body.scanData;

    if (!checkDetailsDataIntegrity(pilot)) {
      return errorResponse.respond(req, res, 'status', 'Invalid detail data.');
    }

    async.waterfall([
        function(callback){
          hostileService.getById(pilot.characterId, function(error, hostile) {
            if (error) callback({'status': 'Unable to find hostile by id ' + pilot.characterId});
            var headerData = headerParser.parse(req);

            if (hostile !== null) {
              hostile.shipType = pilot.shipType;
              headerData.systemId = hostile.systemId;
              headerData.systemName = hostile.systemName;
            }
            callback(null, hostile, headerData);
          });
        },
        function(pilot, headerData, callback){
          hostileService.updateAndGet(headerData, pilot, req.session.fleetKey, function(error, hostile) {
            callback(null, hostile);
          });
        }
    ], function (error, hostile) {
      if (error) return errorResponse.respond(req, res, 'status', 'Unable to parse status.');
      eventService.addAndGet('updateHostile', hostile, req.session.fleetKey, function(error, event) {
        successResponse.respond(res);
      });
    });
  };

  return pub;
};
