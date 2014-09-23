module.exports = function (memberService, sessionService, logger) {

  var pub = {};

  pub.run = function (req, res) {
    logger.processing(req);

    memberService.getByKey(req.body.key, function (error, member) {
      if (member) {
        req.flash('error', 'Linking pilot ' + member.name);
        sessionService.linkToMember(req, member)
      } else {
        req.flash('error', 'Invalid Pilot Key');
      }

      res.redirect('/link');
    });
  };

  return pub;
};
