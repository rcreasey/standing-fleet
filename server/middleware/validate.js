var header_parser = require('./header-parser')
  , response = require(__dirname + '/../response')
  , settings = require(__dirname + '/../config/settings')
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
  var fleet = (req.session.linked) ? req.session.linked : header_parser(req);

  if (fleet.trusted && fleet.trusted.toLowerCase() === 'no') return response.error(res, 'trust', 'To use Standing Fleet, you need to enable trust for this domain. Please enable trust and refresh.');
  if (!checks.igb_request(fleet)) {
    return response.error(res, 'request', 'You do not seem to be running the IGB, or your request was corrupted.');
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
      return response.error(res, 'session', 'Error validating session');
    })
    .done();
};
module.exports.session = session;

var poll = function(req, res, next) {
  var msSinceLastPoll = (moment().unix() - req.session.lastPollTs);
  if (msSinceLastPoll < settings.minPollInterval) {
    return response.error(res, 'poll', 'You are polling too quickly.');
  }

  req.session.lastPollTs = moment().unix();
  return next();
};
module.exports.poll = poll;

var igb = function(req, res, next) {
  if (!checks.igb_request( header_parser(req) )) return res.redirect('/login');

  return next();
};
module.exports.igb = igb;

var is_authenticated = function(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.redirect('/login');
};
module.exports.is_authenticated = is_authenticated;