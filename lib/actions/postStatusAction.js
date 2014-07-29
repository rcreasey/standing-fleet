module.exports = function (hostileService, eventService, memberService, standingsService, neow, headerParser, errorResponse, successResponse, _) {

  var pub = {};

  var checkStatusDataIntegrity = function (status) {
    if (!typeof(status) === 'object'
      || !status.systemId
      || !status.systemName
      || !status.reporterId
      || !status.reporterName
      || !status.text
      || !status.pilots
      || !typeof(status.pilots) === 'object') {
      return false;
    }

    return true;
  };

  pub.run = function (req, res) {
    var scanData = req.body.scanData;

    if (scanData.pilots === undefined) scanData.pilots = [];
    if (!checkStatusDataIntegrity(scanData)) {
      return errorResponse.respond(res, 'status', 'Invalid status data.');
    }

    var eveapi = new neow.EveClient();

    eveapi.fetch('eve:CharacterID', {names: scanData.pilots.join(',')})
      .then(function(results) {

        eveapi.fetch('eve:CharacterAffiliation', {ids: _.map(results.characters, function(c) { return c.characterID; }).join(",")})
          .then(function(results) {
            var hostiles = [];

            _.forEach(results.characters, function(character) {
              if ( standingsService.isWhitelisted(character) ) return;

              hostiles.push({ id: character.characterID
                           , name: character.characterName
                           , corporationID: character.corporationID
                           , corporationName: character.corporationName
                           , allianceID: character.allianceID
                           , allianceName: character.allianceName
              });
            });

            return hostiles;
          })
          .then(function(hostiles) {
            scanData.pilots = hostiles;
            scanData.text = (scanData.pilots.length > 0) ? 'hostile' : 'clear';

            if (scanData.text === 'clear') {
              hostileService.removeBySystemId(scanData.systemId, function (error, status) {
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
          })

      })
      .catch(function(error) {
        if (error) return errorResponse.respond(res, 'status', 'Unable to parse character data.');
      });

  };

  return pub;
};
