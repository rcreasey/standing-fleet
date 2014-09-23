module.exports = function (logger) {

  var pub = {};

  pub.run = function (req, res) {
    logger.processing(req);

    res.render('link', { user: req.user, linked: req.session.linked, error: req.flash('error') });
  };

  return pub;
};
