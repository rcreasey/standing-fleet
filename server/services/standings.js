var request = require('request')
  , xml2js = require('xml2js')
  , _ = require('lodash')

exports.update = function(whitelist) {

  if (process.env.NODE_ENV === 'test') return;

  request(whitelist.url, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      xml2js.parseString(body, function (parse_error, standings) {
        if (!parse_error) {

          whitelist.corporations = _.filter(standings.eveapi.result[0].rowset[0].row, function(s) {
            return parseFloat(s.$.standing) >= whitelist.threshold;
          });
          whitelist.corporations = _.map(whitelist.corporations, function(e) { return e.$.contactID; });

          whitelist.alliances = _.filter(standings.eveapi.result[0].rowset[1].row, function(s) {
            return parseFloat(s.$.standing) >= whitelist.threshold;
          });
          whitelist.alliances = _.map(whitelist.alliances, function(e) { return e.$.contactID; });

          console.log('Standings: ' + whitelist.alliances.length + ' alliances whitelisted.');
          console.log('Standings: ' + whitelist.corporations.length + ' corporations whitelisted.');
        } else {
          console.log('Standings: Error parsing standings: ' + parser_error);
        }
      });
    } else {
      console.log('Standings: Error fetching standings: ' + error);
    }
  });

  return;
};
