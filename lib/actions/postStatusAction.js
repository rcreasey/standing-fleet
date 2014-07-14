module.exports = function (hostileService, eventService, memberService, headerParser, errorResponse, successResponse) {

  var pub = {};

  var checkStatusDataIntegrity = function (status) {
    for (var index in status) {
      if (!typeof(status) === 'object') {
        // || !status[index].text
        // || !status[index].reporterId
        // || !status[index].reporterName
        // || !status[index].systemId
        // || !status[index].systemName
        return false;
      }
    }

    return true;
  };

  pub.run = function (req, res) {
    var scanData = req.body.scanData;

    if (!checkStatusDataIntegrity(scanData)) {
      return errorResponse.respond(res, 'status', 'Invalid status data.');
    }

    if (scanData.text === 'clear') {
      hostileService.removeBySystem(scanData.systemId, function (error, status) {
        if (error) return errorResponse.respond(res, 'status', 'Unable to add status.');

        memberService.getByKey(req.session.memberKey, function (error, member) {
          if (error) return errorResponse.respond(res, 'member', 'Error fetching member');
          eventService.addAndGet('reportClear', scanData, req.session.armadaKey, function (error, event) {
            successResponse.respond(res);
          });
        });

      });

    } else if (scanData.text === 'hostile') {

      hostileService.addAndGet(headerParser.parse(req), scanData, req.session.armadaKey, function (error, status) {
        if (error) return errorResponse.respond(res, 'status', 'Unable to add status.');

        memberService.getByKey(req.session.memberKey, function (error, member) {
          if (error) return errorResponse.respond(res, 'member', 'Error fetching member');

          eventService.addAndGet('reportHostile', status, req.session.armadaKey, function (error, event) {
            successResponse.respond(res);
          });
        });
      });

    }
  };

  return pub;
};
