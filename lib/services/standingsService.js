var request = require('request')
  , xml2js = require('xml2js')

module.exports = function (settings, logger, _) {

  var pub = {};

  pub.updateStandings = function() {

    request(settings.whitelist.url, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        xml2js.parseString(body, function (parse_error, standings) {
          if (!parse_error) {
            logger.log('Standings updated from ' + settings.whitelist.url);

            settings.whitelist.corporations = _.filter(standings.eveapi.result[0].rowset[0].row, function(s) {
              return parseInt(s.$.standing) >= settings.whitelist.threshold;
            })
            settings.whitelist.corporations = _.map(settings.whitelist.corporations, function(e) { return e.$.contactID });

            settings.whitelist.alliances = _.filter(standings.eveapi.result[0].rowset[1].row, function(s) {
              return parseInt(s.$.standing) >= settings.whitelist.threshold;
            })
            settings.whitelist.alliances = _.map(settings.whitelist.alliances, function(e) { return e.$.contactID });

            logger.log( settings.whitelist.alliances.length + ' alliances whitelisted.');
            logger.log( settings.whitelist.corporations.length + ' corporations whitelisted.');
          } else {
            throw "Error parsing standings: " + parse_error;
          }
        });
      } else {
        throw "Error fetching standings: " + error;
      }
    });

  };

  pub.isWhitelisted = function(character) {
    if (_.contains(settings.whitelist.alliances, character.allianceID)) return true;
    if (_.contains(settings.whitelist.corporations, character.allianceID)) return true;

    if (_.contains(settings.whitelist.alliances, character.corporationID)) return true;
    if (_.contains(settings.whitelist.corporations, character.corporationID)) return true;
  };

  return pub;

};
