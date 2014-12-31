var Q = require('q')
  , moment = require('moment')
  , _ = require('lodash')

var settings = require(__dirname + '/../config/settings')
  , Fleet = require(__dirname + '/../models/fleet')
  , Event = require(__dirname + '/../models/event')
  , Member = require(__dirname + '/../models/member')
  , Hostile = require(__dirname + '/../models/hostile')
  , Report = require(__dirname + '/../models/report')
  , Scan = require(__dirname + '/../models/scan')

var clean_timer = 0;

var clean_fleets = function() {
  Fleet.findQ({ts: { $lte: moment().unix() - +settings.fleetTtl }})
    .then(function(fleets) {
      _.forEach(fleets, function(fleet) {

        Event.removeQ({fleetKey: fleet.key});
        Scan.removeQ({fleetKey: fleet.key});
        Member.removeQ({fleetKey: fleet.key});
        Hostile.removeQ({fleetKey: fleet.key});
        Report.removeQ({fleetKey: fleet.key});

      });
    });

};

var clean_members = function() {
  Member.findQ({ts: { $lte: moment().unix() - +settings.memberTtl }})
    .then(function(members) {
      _.forEach(members, function(member) {
        var event = Event.prepare('memberTimedOut', member.fleetKey, member);
        event.saveQ();
        member.removeQ();
      })
    });
};

var clean_hostiles = function() {
  Hostile.findQ({ts: { $lte: moment().unix() - +settings.hostileTtl }})
    .then(function(hostiles) {      
      _.forEach(hostiles, function(hostile) {
        if (!hostile.is_faded) {
          var event = Event.prepare('hostileFaded', hostile.fleetKey, hostile);
          event.saveQ();
          hostile.is_faded = true;
          hostile.saveQ();          
        }
      })
    });
    
  Hostile.findQ({ts: { $lte: moment().unix() - (+settings.hostileTtl * 3) }})
    .then(function(hostiles) {      
      _.forEach(hostiles, function(hostile) {
        var event = Event.prepare('hostileTimedOut', hostile.fleetKey, hostile);
        event.saveQ();
        hostile.removeQ();
      })
    });
};

var clean_loop = function() {
  clean_timer = setTimeout(function() {
    console.log('Consuela: Cleaning');

    clean_fleets();
    clean_members();
    clean_hostiles();

    clean_loop();
  }, settings.cleanInterval);
};

exports.start_cleaning = function() {
  clearTimeout(clean_timer);
  clean_loop();
};

exports.stop_cleaning = function() {
  clearTimeout(clean_timer);
};
