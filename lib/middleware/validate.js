var header_parser = require('./header-parser')
  , error_response = require(__dirname + '/../response/error')

/**
 * Parse IGB headers and populate `req.session.fleet`
 * with an object keyed by the IGB header names.
 *
 * @param {Object} [options]
 * @return {Function}
 * @api public
 */

var headers = function (req, res, next) {
  if (req.fleet || req.session.fleet) return next();
  var fleet = header_parser(req);

  if (fleet.trusted && fleet.trusted.toLowerCase() === 'no') {
    var message = 'To use Standing Fleet, you need to enable trust for this domain. Please enable trust and refresh.';
		return error_response.respond(res, 'trust', message);
  }

  if ( !fleet.trusted
    || !fleet.name
    || !fleet.systemName
    || !fleet.id
    || !fleet.systemId) {
    var message = 'You do not seem to be running the IGB, or your request was corrupted.';
    return error_response.respond(res, 'request', message);
  }

  req.session.fleet = fleet;
  next();
};

module.exports.headers = headers;

var session = function(req, res, next) {
	sessionService.checkIfValid(req, function (error, isValid) {
		if (!isValid) {
			var message = 'Invalid or no session.';
			return error_response.respond(res, 'session', message);
		} else {
			next();
		}
	});
};

module.exports.session = session;

var poll = function(req, res, next) {
	if (!sessionService.verifyPoll(req)) {
		var message = 'You are polling too quickly.';
		return error_response.respond(res, 'session', message);
	}

	next();
};

module.exports.poll = poll;
