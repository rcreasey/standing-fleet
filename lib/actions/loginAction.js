module.exports = function (logger) {

  var pub = {};

  pub.run = function (req, res) {
    logger.log('Processing \'login\' request', 0);
    res.render('login', { user: req.user, error: req.flash('error') });
  };

  return pub;
};
