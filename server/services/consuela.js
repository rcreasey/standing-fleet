var Q = require('q')
  , moment = require('moment')
  , morgan = require('morgan')
  , _ = require('lodash')
  , fs = require('fs')

var settings = require(__dirname + '/../config/settings')
  , standings = require(__dirname + '/standings')
  , Advisory = require(__dirname + '/../models/advisory')
  , Fleet = require(__dirname + '/../models/fleet')
  , Event = require(__dirname + '/../models/event')
  , Jump = require(__dirname + '/../models/jump')
  , Member = require(__dirname + '/../models/member')
  , Hostile = require(__dirname + '/../models/hostile')
  , Report = require(__dirname + '/../models/report')
  , Scan = require(__dirname + '/../models/scan')
  , System = require(__dirname + '/../models/system')

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
  });
};

var update_standings = function() {
  console.log('Consuela: Updating Standings');

  standings.update(settings.whitelist);
};

var update_jumpbridges = function() {
  console.log('Consuela: Updating Jumpbridges');

  var pathToFile = __dirname + '/../../test/fixtures/jumpbridges.txt';
   
  fs.readFile(pathToFile, function (err, data) {
    var parser = /(.+)\t([A-Z0-9\-]+) \@ (\d+)-(\d+)\t([A-Z0-9\-]+) \@ (\d+)-(\d+)\t(\w+)\t(.*)\t(.*)\t([\d\.]+)\t(\w+)\t(\w+)/;
    
    _.each(data.toString().split('\n'), function(line) {
      var result = parser.exec(line);
      if (result) {

        System.findQ({$or: [{name: result[2]}, {name: result[5]}] })
          .spread(function(from_system, to_system) {
            
            var jumpbridge_data = {
              fromPlanet: result[3],
              fromMoon: result[4],
              toPlanet: result[6],
              toMoon: result[7],
              status: result[8],
              owner: result[9],
              password: result[10],
              distance: result[11],
              route:  result[12],
              friendly: result[13]
            };
            
            var jump = {toSystem: to_system.id, fromSystem: from_system.id,
                        toRegion: to_system.regionID, fromRegion: from_system.regionID,
                        toConstellation: to_system.constellationID, fromConstellation: from_system.constellationID,
                        jumpbridge_data: jumpbridge_data};
            
            Jump.updateQ({toSystem: to_system.id, fromSystem: from_system.id}, jump, {upsert: true});
          });

      }  
    }); 
  });  
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
      });
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
      });
    });
};

var clean_events = function() {
  console.log('Consuela: Cleaning Events');

  Event.removeQ({ts: { $lte: moment().unix() - +settings.eventTtl }});
};

var clean_scans = function() {
  console.log('Consuela: Cleaning Scans');

  Scan.removeQ({ts: { $lte: moment().unix() - +settings.scanTtl }});
};

var clean_reports = function() {
  console.log('Consuela: Cleaning Reports');

  Report.removeQ({ts: { $lte: moment().unix() - +settings.reportTtl }});
};

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
      });
    });

  Hostile.findQ({ts: { $lte: moment().unix() - +settings.hostileRemoveTtl }})
    .then(function(hostiles) {
      _.forEach(hostiles, function(hostile) {
        Event.prepare('hostileTimedOut', hostile.fleetKey, hostile)
          .saveQ();
        hostile.removeQ();
      });
    });
};

var clean_wormhole_jumps = function() {
  console.log('Consuela: Cleaning Wormhole Jumps');

  Jump.removeQ({"wormhole_data.expires_on": {$lte: moment().unix()}})
    .then(function(jumps) {
      if (jumps) Event.prepare('refreshSystems', 'all').saveQ();
    });  
};

var clean_loop = function(logger) {
  clean_timer = setTimeout(function() {
    if (process.env.CONSUELA !== 'disable') {
      clean_advisories();
      clean_fleets();
      clean_members();
      clean_hostiles();
      clean_events();
      clean_scans();
      clean_reports();
      clean_wormhole_jumps();
    }

    ensure_fleets();
    update_standings();
    update_jumpbridges();

    clean_loop();
  }, settings.cleanInterval);
};

exports.start_cleaning = function(logger) {
  clearTimeout(clean_timer);
  clean_loop(logger);
};

exports.stop_cleaning = function() {
  clearTimeout(clean_timer);
};
