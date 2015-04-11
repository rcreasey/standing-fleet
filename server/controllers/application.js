var checks = require(__dirname + '/../middleware/checks')
  , Event = require(__dirname + '/../models/event')
  , Member = require(__dirname + '/../models/member')
  , header_parser = require(__dirname + '/../middleware/header-parser')
  , settings = require(__dirname + '/../config/settings')
  , moment = require('moment')

exports.join = function(req, res, next) {
  var fleet = (req.session.isLinked) ? req.session.fleet : header_parser(req);
  
  Member.prepare(req.params.fleetKey, fleet, function(member) {
    req.session.fleetKey = member.fleetKey;
    req.session.memberKey = member.key;
    req.session.lastPollTs = moment().unix() - settings.minPollInterval;
    req.session.lastStatusTs = moment().unix() - settings.minPollInterval;
    req.session.fleet = fleet;

    if (req.session.isLinked === true) { 
      req.session.fleet.trusted = 'Yes';
      return res.redirect('/' + req.params.fleetKey); 
    }
    
    member.saveQ()
      .then(function(member) {
        if (!member) { throw 'Unable to join member to fleet.'; }
        Event.prepare('memberJoined', fleet.key, member.toObject()).saveQ();

        return res.redirect('/' + req.params.fleetKey);
      })
      .catch(function(error) {
        req.flash('error', 'Error joining fleet: ' + error.text);
        return res.redirect('/');
      })
      .done();  
  });

};

exports.index = function(req, res, next) {
  res.render('main', { user: req.user, is_trusted: checks.is_trusted(req) });
};

exports.login = function(req, res, next) {
  if (req.isAuthenticated()) return res.redirect('/link');
  res.render('login', { user: req.user, is_trusted: checks.is_trusted(req), error: req.flash('error') });
};

exports.authenticate = function(req, res, next) {
  res.redirect('/link');
};

exports.logout = function(req, res, next) {
  req.logout();
  res.redirect('/');
};

exports.link = function(req, res, next) {
  res.render('link', { user: req.user, linked: req.session.fleet, success: req.flash('success'), error: req.flash('error') });
};

exports.link_pilot = function(req, res, next) {
  var member_key = req.body.key;

  Member.findOne({key: member_key}, '-_id -__v')
    .lean()
    .cache(true, 5)
    .execQ()
    .then(function(member) {
      if (!member) { throw 'Invalid Pilot Key \'' + member_key + '\''; }

      req.flash('success', 'Linking pilot ' + member.characterName);

      req.session.fleetKey = member.fleetKey;
      req.session.memberKey = member.key;
      req.session.lastPollTs = moment().unix() - settings.minPollInterval;
      req.session.lastStatusTs = moment().unix() - settings.minPollInterval;
      req.session.fleet = member;
      req.session.fleet.trusted = 'Yes';                
      req.session.isLinked = true;

    })
    .catch(function(error) {
      req.flash('error', error);
    })
    .done(function() {
      return res.redirect('/link');  
    });

};

exports.unlink = function(req, res, next) {
  if (req.session.isLinked) {
    req.flash('error', 'Unlinking pilot ' + req.session.fleet.characterName);

    delete req.session.fleetKey;
    delete req.session.memberKey;
    delete req.session.isLinked;
    delete req.session.fleet;
    delete req.session.lastPollTs;
    delete req.session.lastStatusTs;
  }

  return res.redirect('/link');  
};

exports.overview = function(req, res, next) {

  res.render('overview', { user: req.user, success: req.flash('success'), error: req.flash('error') });
};
