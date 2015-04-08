var header_parser = require('./header-parser')
  , passport = require('passport')
  , _ = require('lodash')
  , moment = require('moment')
  , response = require(__dirname + '/../response')
  , settings = require(__dirname + '/../config/settings')
  , checks = require(__dirname + '/../middleware/checks')
  , Member = require(__dirname + '/../models/member')

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

  if (fleet.trusted !== 'Yes') { 
    return response.error(res, 'trust', 'To use Standing Fleet, you need to enable trust for this domain. Please enable trust and refresh.'); 
  } else if (!checks.igb_request(fleet)) {
    return response.error(res, 'request', 'You do not seem to be running the IGB, or your request was corrupted.');
  }

  req.session.fleet = fleet;

  return next();
};
module.exports.headers = headers;

var session = function(req, res, next) {
  if (req.user) { return next(); }
  if (!checks.for_existing_fleet(req)) { return response.error(res, 'session', 'Invalid or no session.'); }
  
  Member.findOne({fleetKey: req.session.fleetKey, key: req.session.memberKey})
    .lean()
    .cache(true, 3600)
    .then(function(result) {
      if (!result) { throw 'Error validating session.'; }
      
      if (req.session.fleetKey && req.session.memberKey) {
        req.session.fleet.fleetKey = req.session.fleetKey;
        req.session.fleet.key = req.session.memberKey;
      }
      
      return next();
    })
    .catch(function(error) {
      return response.error(res, 'session', error);
    })
    .done();
};
module.exports.session = session;

var logged_in = function(req, res, next) {
  if (!req.user) { return res.redirect('/login'); }
  return next();
};
module.exports.logged_in = logged_in;

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
  if (!checks.igb_request( header_parser(req) )) { return res.redirect('/login'); }

  return next();
};
module.exports.igb = igb;

var is_authenticated = function(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  return res.redirect('/login');
};
module.exports.is_authenticated = is_authenticated;

var is_authorized = function(req, res, next) {
  if (process.env.NODE_ENV === 'development') { return next(); }

  if (!req.user ||
      !req.user.groups ||
      _.intersection(req.user.groups, settings.clearance).length === 0) {
    req.flash('error', 'UNAUTHORIZED: You are not cleared for this data.');
    return res.redirect('/link');
  }
  
  return next();
};
module.exports.is_authorized = is_authorized;

var authentication = function(req, res, next) {
  if (process.env.NODE_ENV === 'development') {
    passport.authenticate('local', { failureRedirect:'/login', failureFlash:"Invalid username or password." }) (req, res, next);
  } else {
    passport.authenticate('atlassian-crowd', { failureRedirect:'/login', failureFlash:"Invalid username or password." }) (req, res, next);
  }

};
module.exports.authentication = authentication;
