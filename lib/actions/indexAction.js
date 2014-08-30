module.exports = function (logger) {

  var pub = {};

  pub.run = function (req, res) {
    logger.log('Processing \'index\' request', 0)
    res.render('../public/index', { user: req.user });
  };

  return pub;
};
