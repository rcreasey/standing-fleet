module.exports = function (hostileService, eventService, memberService, async, eveapi, headerParser, settings, errorResponse, successResponse, _) {

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

    async.waterfall([
      function(callback){
        eveapi.fetch('eve:CharacterID', {names: scanData.pilots.join(',')}, callback);
      },
      function(results, callback) {
        eveapi.fetch('eve:CharacterAffiliation'
                   , {ids: _.map(results.characters, function(c) { return c.characterID; }).join(",") }
                   , callback);
      },
      function(results, callback){
        var hostiles = [];
        _.forEach(results.characters, function(character) {

          if (_.contains(settings.whitelist.alliances, parseInt(character.allianceID))) return;
          if (_.contains(settings.whitelist.corporations, parseInt(character.corporationID))) return;

          hostiles.push({ id: character.characterID
                       , name: character.characterName
                       , corporationID: character.corporationID
                       , corporationName: character.corporationName
                       , allianceID: character.allianceID
                       , allianceName: character.allianceName
                       , shipTypeId: null
                       , shipType: null
                       , shipName: null
          });

        });

        callback(null, hostiles);
      }
    ], function (error, hostiles) {
      if (error) return errorResponse.respond(res, 'status', 'Unable to parse character data.');

      scanData.pilots = hostiles;
      scanData.text = (scanData.pilots.length > 0) ? 'hostile' : 'clear';

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
    });

  };

  return pub;
};
