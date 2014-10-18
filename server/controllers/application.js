var response = require(__dirname + '/../response')
  , Member = require(__dirname + '/../models/member')

exports.index = function(req, res, next) {
  res.render('main', { user: req.user });
};

exports.login = function(req, res, next) {
  res.render('login', { user: req.user, error: req.flash('error') });
};

exports.authenticate = function(req, res, next) {
  res.redirect('/link');
};

exports.logout = function(req, res, next) {
  req.logout();
  res.redirect('/');
};

exports.link = function(req, res, next) {
  res.render('link', { user: req.user, linked: req.session.linked, success: req.flash('success'), error: req.flash('error') });
};

exports.link_pilot = function(req, res, next) {
  delete req.session.linked;

  var member_key = req.body.key;

  Member.findOne({key: member_key}).exec(function(err, member) {
    if (member) {
      req.flash('success', 'Linking pilot ' + member.characterName);

      member.link_to_session(req.session);
      req.session.linked = member.toObject();
      req.session.linked.trusted = 'Yes';
      req.session.linked.isLinked = true;

    } else {
      req.flash('error', 'Invalid Pilot Key \'' + member_key + '\'');
    }

    res.redirect('/link');
  });

};

exports.unlink = function(req, res, next) {
  if (req.session.linked) {
    req.flash('error', 'Unlinking pilot ' + req.session.linked.characterName)
    delete req.session.linked;
    delete req.session.fleetKey;
    delete req.session.memberKey;
    delete req.session.lastPollTs;
    delete req.session.lastStatusTs;
  }

  res.redirect('/link');
}
