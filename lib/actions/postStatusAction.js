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
    logger.log('Processing post \'status\' request', 0);

    var scanData = req.body.scanData;

    if (scanData.pilots === undefined) scanData.pilots = [];
    if (!checkStatusDataIntegrity(scanData)) {
      return errorResponse.respond(res, 'status', 'Invalid status data.');
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
                var hostiles = [];

                async.each(scanData.pilots, function(pilot, callback) {
                  async.waterfall([
                      function(callback){
                        hostileService.getById(pilot.id, function(error, result) {
                          if (error) return errorResponse.respond(res, 'status', 'Unable to find hostile by id ' + pilot.id);
                          if (result !== null) {
                            pilot.key = result.key;
                            if (result.shipType !== null) pilot.shipType = result.shipType;
                            if (result.shipTypeId !== null) pilot.shipTypeId = result.shipTypeId;
                          }
                          callback(null, pilot);
                        });
                      },
                      function(pilot, callback){
                        hostileService.updateAndGet(headerParser.parse(req), pilot, req.session.armadaKey, function(hostile) {
                          callback(null, hostile);
                        });
                      }
                  ], function (error, hostile) {
                    if (error) return errorResponse.respond(res, 'status', 'Unable to parse status.');
                    hostiles.push(hostile);
                    callback();
                  });

                }, function(error) {
                  if (error) return errorResponse.respond(res, 'member', 'Error fetching member');
                  eventService.addAndGet('reportHostile', hostiles, req.session.armadaKey, function(error, event) {
                    try {
                      successResponse.respond(res);
                    } catch (err) {
                      // we've already sent a response and we just silently continue
                      return true;
                    }
                  });
                });
              }
            })

        })
        .catch(function(error) {
          if (error) return errorResponse.respond(res, 'status', 'Unable to parse character data.');
        });
    });

  };

  return pub;
};
