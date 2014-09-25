module.exports = function (hostileService, eventService, memberService, standingsService, neow, headerParser, errorResponse, successResponse, async, chunk, _, logger) {

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
    logger.processing(req);

    var scanData = req.body.scanData;
    if (scanData.pilots === undefined) scanData.pilots = [];
    if (!checkStatusDataIntegrity(scanData)) {
      return errorResponse.respond(req, res, 'status', 'Invalid status data.');
    }

    var eveapi = new neow.EveClient();

    // eve api will only accept 100 pilots per api call
    _.forEach( chunk(scanData.pilots, 100), function(pilots) {
      eveapi.fetch('eve:CharacterID', {names: pilots.join(',')})
        .then(function(results) {

          eveapi.fetch('eve:CharacterAffiliation', {ids: _.map(results.characters, function(c) { return c.characterID; }).join(",")})
            .then(function(results) {
              var hostiles = [];
              _.forEach(results.characters, function(character) {
                if ( standingsService.isWhitelisted(character) ) return;
                if ( character.characterID == 0 ) return;
                if ( character.characterName == '' ) return;

                hostiles.push({ characterId: character.characterID
                             , characterName: character.characterName
                             , corporationId: character.corporationID
                             , corporationName: character.corporationName
                             , allianceId: character.allianceID
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
                  if (error) return errorResponse.respond(req, res, 'status', 'Unable to add status.');

                  memberService.getByKey(req.session.memberKey, function (error, member) {
                    if (error) return errorResponse.respond(req, res, 'member', 'Error fetching member');
                    eventService.addAndGet('reportClear', scanData, req.session.fleetKey, function (error, event) {
                      successResponse.respond(res);
                    });
                  });

                });

              } else if (scanData.text === 'hostile') {
                var hostiles = [];

                async.each(scanData.pilots, function(pilot, callback) {
                  async.waterfall([
                      function(callback){
                        hostileService.getById(pilot.characterId, function(error, result) {
                          if (error) callback({'status': 'Unable to find hostile by id ' + pilot.id});
                          if (result !== null) {
                            pilot.key = result.key;
                            if (result.shipType !== null) pilot.shipType = result.shipType;
                            if (result.shipTypeId !== null) pilot.shipTypeId = result.shipTypeId;
                          }
                          callback(null, pilot);

                        });
                      },
                      function(pilot, callback){
                        hostileService.updateAndGet(headerParser.parse(req), pilot, req.session.fleetKey, function(error, hostile) {
                          callback(null, hostile);
                        });
                      }
                  ], function (error, hostile) {
                    if (error) return errorResponse.respond(req, res, 'hostile', 'Error reporting hostiles. e1');
                    hostiles.push(hostile);
                    callback(null, hostiles);
                  });

                }, function(error) {
                  if (error) return errorResponse.respond(req, res, 'hostile', 'Error reporting hostiles. e2');
                  eventService.addAndGet('reportHostile', hostiles, req.session.fleetKey, function(error, event) {
                    if (error) return errorResponse.respond(req, res, 'hostile', 'Error reporting hostiles. e3');
                    successResponse.respond(res);
                  });
                });
              }
            })

        })
        .catch(function(error) {
          if (error) return errorResponse.respond(req, res, 'status', 'Unable to parse character data');
        });
    });

  };

  return pub;
};
