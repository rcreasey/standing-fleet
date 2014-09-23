module.exports = function (passport, logger) {

  var pub = {};


  pub.authenticate = function (req, res) {
    logger.processing(req);
    logger.log('trying to passport')
    passport.authenticate('atlassian-crowd', { failureRedirect:'/login', failureFlash:"Invalid username or password." })
    res.redirect('/link');
  };

  pub.run = function (req, res) {
    logger.processing(req);

    res.render('login', { user: req.user, error: req.flash('error') });
  };

  return pub;
};
