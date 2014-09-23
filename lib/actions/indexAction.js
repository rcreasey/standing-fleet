module.exports = function (logger) {

  var pub = {};

  pub.run = function (req, res) {
    logger.processing(req);
    res.render('main', { user: req.user });
  };

  return pub;
};
