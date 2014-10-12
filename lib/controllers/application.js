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
  res.render('link', { user: req.user, linked: req.session.linked, error: req.flash('error') });
};

exports.link_pilot = function(req, res, next) {
  delete req.session.linked;

  Member.findOneQ({key: req.body.key})
    .then(function(member) {
      req.flash('error', 'Linking pilot' + member.characterName);

      member.link_to_session(req.session);
      req.session.linked = member;
      req.session.linked.trusted = 'Yes';
      req.session.linked.isLinked = true;

      return member;
    })
  .catch(function(error) {
    console.log(error)
    return req.flash('error', 'Invalid Pilot Key.');
  })
  .done(function() {
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
