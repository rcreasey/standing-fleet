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

	return pub;
}