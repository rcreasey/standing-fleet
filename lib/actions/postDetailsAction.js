module.exports = function (hostileService, eventService, headerParser, errorResponse, successResponse, async, logger) {

  var pub = {};

  var checkDetailsDataIntegrity = function (details) {
    if (!typeof(details) === 'object'
      || !details.type
      || !details.key
      || !details.id
      || !details.name
      || (!details.shipType && !details.shipName) ) {
      return false;
    }

    return true;
  };

  pub.run = function (req, res) {
    logger.log('Processing post \'details\' request', 0);

    var pilot = req.body.scanData;

    if (!checkDetailsDataIntegrity(pilot)) {
      return errorResponse.respond(req, res, 'status', 'Invalid detail data.');
    }

    async.waterfall([
        function(callback){
          hostileService.getById(pilot.id, function(error, hostile) {
            if (error) return errorResponse.respond(req, res, 'status', 'Unable to find hostile by id ' + pilot.id);
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
          hostileService.updateAndGet(headerData, pilot, req.session.armadaKey, function(hostile) {
            callback(null, hostile);
          });
        }
    ], function (error, hostile) {
      if (error) return errorResponse.respond(req, res, 'status', 'Unable to parse status.');
      eventService.addAndGet('updateHostile', hostile, req.session.armadaKey, function(error, event) {
        successResponse.respond(res);
      });
    });
  };

  return pub;
};
