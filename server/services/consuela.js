var Q = require('q')
  , moment = require('moment')
  , _ = require('lodash')

var settings = require(__dirname + '/../config/settings')
  , Advisory = require(__dirname + '/../models/advisory')
  , Fleet = require(__dirname + '/../models/fleet')
  , Event = require(__dirname + '/../models/event')
  , Member = require(__dirname + '/../models/member')
  , Hostile = require(__dirname + '/../models/hostile')
  , Report = require(__dirname + '/../models/report')
  , Scan = require(__dirname + '/../models/scan')

var clean_timer = 0;

var ensure_fleets = function() {
  console.log('Consuela: Ensuring Fleets');
  
  _.forEach(settings.fleets, function(fleet) {
    var f = Fleet.prepare(fleet);
    Fleet.findOneQ({name: fleet.name})
      .then(function(existing_fleet) {
        if (!existing_fleet) {
          f.saveQ()
            .done();
        }
      })
      .done();
  })  
};

var clean_fleets = function() {
  console.log('Consuela: Cleaning Fleets');
  
  Fleet.findQ({ $or: [{name: null}, {name: {$nin: _.map(settings.fleets, function(f) { return f.name;} ) }}] })
    .then(function(fleets) {
      _.forEach(fleets, function(fleet) {

        Advisory.removeQ({fleetKey: fleet.key});
        Event.removeQ({fleetKey: fleet.key});
        Scan.removeQ({fleetKey: fleet.key});
        Member.removeQ({fleetKey: fleet.key});
        Hostile.removeQ({fleetKey: fleet.key});
        Report.removeQ({fleetKey: fleet.key});

      });
    });

};

var clean_members = function() {
  console.log('Consuela: Cleaning Members');
  
  Member.findQ({ts: { $lte: moment().unix() - +settings.memberTtl }})
    .then(function(members) {
      _.forEach(members, function(member) {
        Event.prepare('memberTimedOut', member.fleetKey, member)
          .saveQ();
        member.removeQ();
      })
    });
};

var clean_advisories = function() {
  console.log('Consuela: Cleaning Advisories');
  
  Advisory.findQ({ts: { $lte: moment().unix() - +settings.advisoryTtl }})
    .then(function(advisories) {
      _.forEach(advisories, function(advisory) {
        Event.prepare('clearAdvisory', advisory.fleetKey, advisory)
          .saveQ();
        advisory.removeQ();
      })
    })
}

var clean_events = function() {
  console.log('Consuela: Cleaning Events');
  
  Event.removeQ({ts: { $lte: moment().unix() - +settings.eventTtl }});
}

var clean_scans = function() {
  console.log('Consuela: Cleaning Scans');
  
  Scan.removeQ({ts: { $lte: moment().unix() - +settings.scanTtl }});
}

var clean_reports = function() {
  console.log('Consuela: Cleaning Reports');
  
  Report.removeQ({ts: { $lte: moment().unix() - +settings.reportTtl }});
}

var clean_hostiles = function() {
  console.log('Consuela: Cleaning Hostiles');
  
  Hostile.findQ({ts: { $lte: moment().unix() - +settings.hostileFadeTtl }})
    .then(function(hostiles) {      
      _.forEach(hostiles, function(hostile) {
        if (!hostile.is_faded) {
          Event.prepare('hostileFaded', hostile.fleetKey, hostile)
            .saveQ();
          hostile.is_faded = true;
          hostile.saveQ();          
        }
      })
    });
    
  Hostile.findQ({ts: { $lte: moment().unix() - +settings.hostileRemoveTtl }})
    .then(function(hostiles) {      
      _.forEach(hostiles, function(hostile) {
        Event.prepare('hostileTimedOut', hostile.fleetKey, hostile)
          .saveQ();
        hostile.removeQ();
      })
    });
};

var clean_loop = function() {
  clean_timer = setTimeout(function() {
    clean_advisories();
    clean_fleets();
    clean_members();
    clean_hostiles();
    clean_events();
    clean_scans();
    clean_reports();
    
    ensure_fleets();

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
