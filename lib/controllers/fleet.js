var success_response = require(__dirname + '/../response/success')
  , error_response = require(__dirname + '/../response/error')

exports.join = function(req, res, next){
  success_response.respond(res, []);
};

exports.leave = function(req, res, next){
  success_response.respond(res, []);
};

exports.status = function(req, res, next){
  success_response.respond(res, []);
};

exports.poll = function(req, res, next){
  success_response.respond(res, []);
};
