module.exports = function() {

  var pub = {};

  pub.validateHeaders = function(req, res, next) {
    // var headers = headerParser.parse(req);
    var headers = {};

    if (headers.trusted && headers.trusted.toLowerCase() === 'no') {
      var message = 'To use Standing Fleet, you need to enable trust for this domain. Please enable trust and refresh.';
      return next({type: 'trust', message: message});
    }

    if ( !headers.trusted
      || !headers.name
      || !headers.systemName
      || !headers.id
      || !headers.systemId) {

      var message = 'You do not seem to be running the IGB, or your request was corrupted.';
      return next({type: 'request', message: message});
    }

    return next();
  };

  return pub;
};
