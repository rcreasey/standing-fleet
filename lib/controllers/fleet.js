var response = require(__dirname + '/../response')
  , settings = require(__dirname + '/../../config/settings')
  , checks = require(__dirname + '/../middleware/checks')
  , header_parser = require(__dirname + '/../middleware/header-parser')
  , Fleet = require(__dirname + '/../models/fleet')
  , Event = require(__dirname + '/../models/event')
  , Member = require(__dirname + '/../models/member')
  , Hostile = require(__dirname + '/../models/hostile')
  , Scan = require(__dirname + '/../models/scan')

var moment = require('moment')
  , Q = require('q')
  , _ = require('lodash')

exports.join = function(req, res, next){
  response.success(res, []);
};

exports.leave = function(req, res, next){
  response.success(res, []);
};

exports.status = function(req, res, next) {
  if (!req.session.fleetKey || !req.session.memberKey) {
    var self = Member.prepare('none', header_parser(req))
    var event = Event.prepare('statusSelf', 'none', self)

    return response.success(res, [ event ]);
  }

  Member.findOneQ({key: req.session.memberKey})
    .then(function(member) {
      // TODO
      // SessionService.checkIfValid ?
      var events = [];
      events.push( Event.prepare('statusSelf', member.fleetKey, member) );

      var tasks = [
        Fleet.findOne({key: member.fleetKey}).execQ().then(function(fleet) {
          return Event.prepare('statusFleet', member.fleetKey, fleet);
        }),
        Event.find({fleetKey: member.fleetKey}).execQ().then(function(events) {
          return Event.prepare('statusEvents', member.fleetKey, events);
        }),
        Member.find({fleetKey: member.fleetKey}).execQ().then(function(members) {
          return Event.prepare('statusMembers', member.fleetKey, members);
        }),
        Hostile.find({fleetKey: member.fleetKey}).execQ().then(function(hostiles) {
          return Event.prepare('statusHostiles', member.fleetKey, hostiles);
        }),
        Scan.find({fleetKey: member.fleetKey}).execQ().then(function(scans) {
          return Event.prepare('statusScans', member.fleetKey, scans);
        })
      ];

      Q.all(tasks)
        .then(function(results) {
          _.each(results, function(result) { events.push(result); });
          return response.success(res, events);
        })
        .catch(function(error) {
          console.log(error)
          return response.error(res, 'state', 'Error fetching fleet tasks.');
        })
        .done();
    })
    .catch(function(error) {
      console.log(error)
      return response.error(res, 'state', 'Error fetching fleet status.');
    })
    .done();

};

exports.poll = function(req, res, next){
  response.success(res, []);
};

exports.create = function(req, res, next) {
  if (req.session.fleetKey || req.session.memberKey) return response.error(res, 'state', 'Please leave your current fleet before creating a new one');

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
