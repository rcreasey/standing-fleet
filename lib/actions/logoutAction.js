module.exports = function (logger) {

  var pub = {};

  pub.run = function (req, res) {
    logger.processing(req);

    if (req.session.passport.user) {
      req.flash('error', 'Logging out pilot ' + req.session.passport.user);
    }

    req.logout();
    res.redirect('/');
  };

  return pub;
};
