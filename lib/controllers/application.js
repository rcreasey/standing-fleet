exports.index = function(req, res, next) {
  res.render('main', { user: req.user });
}

exports.login = function(req, res, next){
  res.send('ok');
};
