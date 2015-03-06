var header_parser = require('./header-parser')
  , passport = require('passport')
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

  if (fleet.trusted !== 'Yes') return response.error(res, 'trust', 'To use Standing Fleet, you need to enable trust for this domain. Please enable trust and refresh.');
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

var authentication = function(req, res, next) {
  if (process.env.NODE_ENV === 'development') {
    passport.authenticate('local', { failureRedirect:'/login', failureFlash:"Invalid username or password." }) (req, res, next);
  } else {
    // passport.authenticate('atlassian-crowd', { failureRedirect:'/login', failureFlash:"Invalid username or password." }) (req, res, next);
    
    passport.authenticate('atlassian-crowd', function(err, user, info) {
      if (err) { return next(err) }
      
      if (!user) {
        req.flash('error', "Invalid username or password.");
        return res.redirect('/login')
      }
      
      console.log('user:')
      console.log(user)
      
      next();
      // req.logIn(user, function(err) {
      //   if (err) { return next(err); }
      //   return res.redirect('/users/' + user.username);
      // });
      // 
    }) (req, res, next);

  }

};
module.exports.authentication = authentication;
