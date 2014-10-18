var rawbody = require('raw-body')
  , response = require(__dirname + '/../response')

exports.redirect_if_authenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect('/link')
  } else {
    next();
  }
};

exports.if_authenticated = function(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
};

exports.request_size = function (req, res, next) {
	rawbody(req, {
		length: req.headers['content-length'],
		limit: settings.requestSizeLimit
	}, function (error, string) {
		if (error) return response.error(req, res, 'request-size', 'Your request was too large');

		next();
	});
};

exports.for_existing_fleet = function(req) {
  return !!(req.session.fleetKey || req.session.memberKey);
};

exports.static_rewrite = function (req, res, next) {
	if (req.url.match(/^\/[A-z0-9]{16}\/$/)) req.url = '/';

	res.header('Cache-Control', 'must-revalidate');
	next();
};

exports.redirect_to_https = function (req, res, next) {
	if (process.env.NODE_ENV !== 'production') next();

	if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] === "http") {
  	res.redirect(301, 'https://' + req.host + req.url);
  }

 	next();
};

exports.ssl_headers = function (req, res, next) {
	if (process.env.NODE_ENV !== 'production') return next();

	res.header('X-Frame-Options', 'DENY');
	res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

	next();
};
