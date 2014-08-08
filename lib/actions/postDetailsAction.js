module.exports = function (hostileService, eventService, headerParser, errorResponse, successResponse, async) {

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
    var pilot = req.body.scanData;

    if (!checkDetailsDataIntegrity(pilot)) {
      return errorResponse.respond(res, 'status', 'Invalid detail data.');
    }

    async.waterfall([
        function(callback){
          hostileService.getById(pilot.id, function(error, hostile) {
            if (error) return errorResponse.respond(res, 'status', 'Unable to find hostile by id ' + pilot.id);
            if (hostile !== null) {

              var headerData = headerParser.parse(req);
              hostile.shipType = pilot.shipType;
              headerData.systemId = pilot.systemId;
              headerData.systemName = pilot.systemName;
            }
            callback(null, hostile);
          });
        },
        function(pilot, callback){
          hostileService.updateAndGet(headerParser.parse(req), pilot, req.session.armadaKey, function(hostile) {
            callback(null, hostile);
          });
        }
    ], function (error, hostile) {
      if (error) return errorResponse.respond(res, 'status', 'Unable to parse status.');
      eventService.addAndGet('updateHostile', hostile, req.session.armadaKey, function(error, event) {
        successResponse.respond(res);
      });
    });
  };

  return pub;
};
