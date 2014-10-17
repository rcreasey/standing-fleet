var header_parser = require('./header-parser')
  , response = require(__dirname + '/../response')
  , settings = require(__dirname + '/../../config/settings')
  , checks = require(__dirname + '/../middleware/checks')
  , Member = require(__dirname + '/../models/member')

var moment = require('moment')

/**
 * Parse IGB headers and populate `req.session.fleet`
 * with an object keyed by the IGB header names.
 *
 * @param {Object} [options]
 * @return {Function}
 * @api public
 */

var headers = function (req, res, next) {
  var fleet = header_parser(req);

  if (fleet.trusted && fleet.trusted.toLowerCase() === 'no') {
    var message = 'To use Standing Fleet, you need to enable trust for this domain. Please enable trust and refresh.';
		return response.error(res, 'trust', message);
  }

  if ( !fleet.trusted
    || !fleet.characterName
    || !fleet.characterId
    || !fleet.systemName
    || !fleet.systemId) {
    var message = 'You do not seem to be running the IGB, or your request was corrupted.';
    return response.error(res, 'request', message);
  }

  req.session.fleet = fleet;
  next();
};

module.exports.headers = headers;

var session = function(req, res, next) {
  if (!checks.for_existing_fleet(req)) return response.error(res, 'session', 'Invalid or no session.');

  Member.findOneQ({fleetKey: req.session.fleetKey, key: req.session.memberKey})
    .then(function(result) {
      return next();
    })
    .catch(function(error) {
      console.log(error)
      return response.error(res, 'state', 'Error validating session');
    })
    .done();
};

module.exports.session = session;

var poll = function(req, res, next) {
  var msSinceLastPoll = (moment().unix() - req.session.lastPollTs);
  if (msSinceLastPoll < settings.minPollInterval) {
    return response.error(res, 'session', 'You are polling too quickly.');
  }

  req.session.lastPollTs = moment().unix();
  return next();
};

module.exports.poll = poll;
