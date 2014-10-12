var response = require(__dirname + '/../response')
  , settings = require(__dirname + '/../../config/settings')
  , checks = require(__dirname + '/../middleware/checks')
  , moment = require('moment')
  , Fleet = require(__dirname + '/../models/fleet')
  , Event = require(__dirname + '/../models/event')
  , Member = require(__dirname + '/../models/member')

exports.join = function(req, res, next){
  response.success(res, []);
};

exports.leave = function(req, res, next){
  response.success(res, []);
};

exports.status = function(req, res, next){
  response.success(res, []);
};

exports.poll = function(req, res, next){
  response.success(res, []);
};

exports.create = function(req, res, next) {
  // check for valid session
  //   sessionService.checkIfValid(req, function (error, isValid) {
  //     if (isValid) {
  //       return errorResponse.respond(req, res, 'state',
  //         'Please <a href="#" onclick="leaveFleet()">leave your current Standing Fleet</a> before creating a new one.');
  //     }

  var fleetPassword = req.body.fleetPassword || false;

  if ( fleetPassword &&
     ( fleetPassword.length > settings.fleetPasswordMaxLength
    || fleetPassword.length < settings.fleetPasswordMinLength)) {

    return response.error(res, 'input',
      'Invalid password. Must consist of ' + settings.fleetPasswordMinLength + ' to ' + settings.fleetPasswordMaxLength + ' characters.');
  }

  var fleet = Fleet.prepare(fleetPassword);
  var member = Member.prepare(fleet.key, req.session.fleet);
  var event = Event.prepare('fleetCreated', fleet.key,
                            { characterId: member.characterId, characterName: member.characterName });

  fleet.saveQ()
    .then(function(result) {
      return member.saveQ();
    })
    .then(function(result) {
      return event.saveQ();
    })
    .then(function(result) {
      member.link_to_session(req.session);
      response.success(res, Event.prepare('fleetCreated', 'none', fleet));
    })
    .catch(function(error) {
      console.log(error)
      return response.error(res, 'state', 'Error creating fleet');
    })
    .done();

};

exports.update_status = function(req, res, next){
  response.success(res, []);
};

exports.add_scan = function(req, res, next){
  response.success(res, []);
};

exports.add_report = function(req, res, next){
  response.success(res, []);
};

exports.pilot_details = function(req, res, next){
  response.success(res, []);
};
