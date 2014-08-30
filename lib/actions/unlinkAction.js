module.exports = function (logger) {

  var pub = {};

  pub.run = function (req, res) {
    logger.log('Processing \'unlink\' request', 0);
    req.flash('error', 'Unlinking pilot ' + req.session.linked.name)
    delete req.session.linked;
    delete req.session.armadaKey;
    delete req.session.memberKey;
    delete req.session.lastPollTs;
    delete req.session.lastStatusTs;

    res.redirect('/link');
  };

  return pub;
};
