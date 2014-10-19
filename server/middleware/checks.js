var rawbody = require('raw-body')
  , response = require(__dirname + '/../response')

exports.igb_request = function(fleet) {
  if ( !fleet.trusted
    || !fleet.characterName
    || !fleet.characterId
    || !fleet.systemName
    || !fleet.systemId) {
      return false;
  } else {
    return true;
  }
};

exports.for_existing_fleet = function(req) {
  return !!(req.session.fleetKey || req.session.memberKey);
};

exports.static_rewrite = function (req, res, next) {
	if (req.url.match(/^\/[A-z0-9]{16}\/$/)) req.url = '/';

	res.header('Cache-Control', 'must-revalidate');
	return next();
};

exports.redirect_to_https = function (req, res, next) {
	if (process.env.NODE_ENV !== 'production') return next();

	if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] === "http") {
  	res.redirect(301, 'https://' + req.host + req.url);
  }

 	return next();
};

exports.ssl_headers = function (req, res, next) {
	if (process.env.NODE_ENV !== 'production') return next();

	res.header('X-Frame-Options', 'DENY');
	res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

	return next();
};
