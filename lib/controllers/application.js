var success_response = require(__dirname + '/../response/success')
  , error_response = require(__dirname + '/../response/error')
  , passport = require('passport')

exports.index = function(req, res, next) {
  res.render('main', { user: req.user });
};

exports.login = function(req, res, next) {
  res.render('login', { user: req.user, error: req.flash('error') });
};

exports.authenticate = function(req, res, next) {
  passport.authenticate('atlassian-crowd', { failureRedirect:'/login', failureFlash:"Invalid username or password." })
  res.redirect('/link');
};

exports.logout = function(req, res, next) {
  req.logout();
  res.redirect('/');
};

exports.link = function(req, res, next) {
  success_response.respond(res, []);
};

exports.link_pilot = function(req, res, next) {

};

exports.unlink = function(req, res, next) {
  success_response.respond(res, []);
}
