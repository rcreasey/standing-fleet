module.exports = function (rawbody, errorResponse, settings) {
	var pub = {};

	pub.validateRequestSize = function (req, res, next) {
		rawbody(req, {
			length: req.headers['content-length'],
			limit: settings.requestSizeLimit
		}, function (error, string) {
			if (error) return errorResponse.respond(res, 'request',
				'Your request was too large');

			next();
		});
	};

	pub.staticRewrite = function (req, res, next) {
		if (req.url.match(/^\/[A-z0-9]{16}\/$/)) req.url = '/';

		res.header('Cache-Control', 'must-revalidate');
		next();
	};

	pub.sslCheck = function (req, res, next) {
		if (process.env.ENV !== 'production') next();

		if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] === "http") {
    	res.redirect(301, 'https://' + req.host + req.url);
    }

	 	next();
	}

	pub.sslHeaders = function (req, res, next) {
		if (process.env.ENV !== 'production') return next();

		res.header('X-Frame-Options', 'DENY');
		res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

		next();
	}

	return pub;
}
