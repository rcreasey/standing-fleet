var success_response = require(__dirname + '/../response/success')
  , error_response = require(__dirname + '/../response/error')

exports.index = function(req, res, next) {
  res.render('main', { user: req.user });
};

exports.login = function(req, res, next) {
  success_response.respond(res, []);
};

exports.logout = function(req, res, next) {
  req.logout();
  res.redirect('/');
};

exports.link = function(req, res, next) {
  success_response.respond(res, []);
};

exports.unlink = function(req, res, next) {
  success_response.respond(res, []);
}
