
exports.index = function(req, res, next) {
  res.render('docs', {class: 'docs'});
  // res.redirect(301, 'https://confluence.goonfleet.com/x/loR-AQ');
};
