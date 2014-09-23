module.exports = function (logger) {

  var pub = {};

  pub.run = function (req, res) {
    logger.processing(req);

    req.flash('error', 'Unlinking pilot ' + req.session.linked.name)
    delete req.session.linked;
    delete req.session.fleetKey;
    delete req.session.memberKey;
    delete req.session.lastPollTs;
    delete req.session.lastStatusTs;

    res.redirect('/link');
  };

  return pub;
};
