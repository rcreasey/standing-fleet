module.exports = function (hostileService, eventService, memberService, headerParser, errorResponse, successResponse) {

  var pub = {};

  var checkDetailsDataIntegrity = function (details) {
    if (!typeof(details) === 'object'
      || !details.type
      || !details.id
      || !details.name
      || (!details.shipType && !details.shipName) ) {
      return false;
    }

    return true;
  };

  pub.run = function (req, res) {
    var detailData = req.body.scanData;

    if (!checkDetailsDataIntegrity(detailData)) {
      return errorResponse.respond(res, 'status', 'Invalid detail data.');
    }

    hostileService.updateAndGet(headerParser.parse(req), detailData, req.session.armadaKey, function (error, status) {
      if (error) return errorResponse.respond(res, 'status', 'Unable to add status.');

      memberService.getByKey(req.session.memberKey, function (error, member) {
        if (error) return errorResponse.respond(res, 'member', 'Error fetching member');

        eventService.addAndGet('updateHostile', status, req.session.armadaKey, function (error, event) {
          successResponse.respond(res);
        });
      });
    });

  };

  return pub;
};
