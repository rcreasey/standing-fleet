var response = require(__dirname + '/../response')
  , settings = require(__dirname + '/../config/settings')
  , Advisory = require(__dirname + '/../models/advisory')
  , Event = require(__dirname + '/../models/event')
  , Fleet = require(__dirname + '/../models/fleet')
  , Hostile = require(__dirname + '/../models/hostile')
  , Jump = require(__dirname + '/../models/jump')
  , Member = require(__dirname + '/../models/member')
  , Region = require(__dirname + '/../models/region')
  , Report = require(__dirname + '/../models/report')
  , Scan = require(__dirname + '/../models/scan')
  , Ship = require(__dirname + '/../models/ship')
  , System = require(__dirname + '/../models/system')

var moment = require('moment')
  , neow = require('neow')
  , Q = require('q')
  , _ = require('lodash')

exports.list = function(req, res, next){
  Fleet.find().select('ts key name description').sort('name').execQ()
    .then(function(fleets) {
      if (fleets) {
        return response.success(res, fleets);
      } else {
        return response.error(res, 'lookup', 'Unable to fetch fleet list.');
      }
    });
};

var is_whitelisted = function(whitelist, character) {
  if (_.contains(whitelist.alliances, character.allianceID)) return true;
  if (_.contains(whitelist.corporations, character.allianceID)) return true;

  if (_.contains(whitelist.alliances, character.corporationID)) return true;
  if (_.contains(whitelist.corporations, character.corporationID)) return true;

  return false;
};

exports.join = function(req, res, next){

  // check to see if pilot is hostile or not
  var client = new neow.EveClient();
  client.fetch('eve:CharacterAffiliation', {ids: req.session.fleet.characterId})
    .then(function(results) {
      if (!is_whitelisted(req.app.settings.whitelist, results.characters[ req.session.fleet.characterId ])) {
        return response.error(res, 'authorization', 'Unable to join fleet.');
      }

      Fleet.findOneQ({key: req.params.fleetKey})
        .then(function(fleet) {

          if (fleet.password && req.params.fleetPassword !== fleet.password) {
            return response.error(res, 'password', 'Invalid Password');
          }
          
          var event = Event.prepare('memberJoined', fleet.key, req.session.fleet);
          return event.saveQ();
        })
        .then(function(event) {
          return response.success(res, event);
        })
        .catch(function(error) {
          console.log(error);
          return response.error(res, 'state', 'Error joining fleet');
        })
        .done();

    })
    .catch(function(error) {
      console.log(error);
      return response.error(res, 'state', 'CCP API Error: ' + error);
    })
    .done();

};

exports.leave = function(req, res, next){
  req.session.regenerate(function(err) {
    if (err) { return response.error(res, 'state', 'Error leaving fleet: ' + err); }

    Member.findOneQ({key: req.session.memberKey})
      .then(function(member) {
        if (!member) { throw 'Invalid member key: ' + req.session.memberKey; }
         
        var event = Event.prepare('memberLeft', member.fleetKey, member.toObject());
        event.saveQ();
        member.removeQ();

        return response.success(res);
      })
      .catch(function(error) {
        console.log(error);
        return response.error(res, 'state', 'Error leaving fleet: ' + error);
      })
      .done(function() {

      });

  });

};

exports.status = function(req, res, next) {
  var events = [];

  Member.findOneQ({key: req.session.memberKey})
    .then(function(member) {
      if (!member) { throw 'Invalid member key: ' + req.session.memberKey; }
      events.push( Event.prepare('statusSelf', member.fleetKey, member.toObject()) );

      return Fleet.findOne({key: member.fleetKey}).execQ();
    })
    .then(function(fleet) {
      if (!fleet) { throw 'Invalid Fleet.'; }
      events.push( Event.prepare('statusFleet', fleet.key, fleet.toObject()) );

      var tasks = [
        Advisory.findQ({fleetKey: fleet.key}).then(function(advisories) {
          return Event.prepare('statusAdvisories', fleet.key, _.map(advisories, function(advisory) { if (advisory !== null) { return advisory.toObject(); } }));
        }),
        Event.find({fleetKey: fleet.key}).execQ().then(function(events) {
          return Event.prepare('statusEvents', fleet.key, _.map(events, function(event) { if (event !== null) { return event.toObject(); } }));
        }),
        Member.find({fleetKey: fleet.key}).execQ().then(function(members) {
          return Event.prepare('statusMembers', fleet.key, _.map(members, function(member) { if (member !== null) { return member.toObject(); } }));
        }),
        Hostile.find({fleetKey: fleet.key, systemId: {$ne: null}}).execQ().then(function(hostiles) {
          return Event.prepare('statusHostiles', fleet.key, _.map(hostiles, function(hostile) { if (hostile !== null) { return hostile.toObject(); } }));
        }),
        Scan.find({fleetKey: fleet.key}).execQ().then(function(scans) {
          return Event.prepare('statusScans', fleet.key, _.map(scans, function(scan) { if (scan !== null) { return scan.toObject(); } }));
        })
      ];

      Q.all(tasks)
        .then(function(results) {
          _.each(results, function(result) { events.push(result); });
          return response.success(res, events);
        })
        .catch(function(error) {
          console.log(error);
          req.session.regenerate(function(err) {
            return response.error(res, 'status', 'Error fetching fleet tasks.');
          });

        })
        .done();
    })
    .catch(function(error) {
      console.log(error);
      req.session.regenerate(function(err) {
        return response.error(res, 'status', 'Error fetching fleet status.');
      });

    })
    .done();

};

exports.poll = function(req, res, next) {
  if (!req.session.fleetKey || !req.session.memberKey) {
    return response.error(res, 'state', 'Error fetching fleet poll.');
  }

  var tasks = [
    Member.findOne({key: req.session.memberKey}).execQ().then(function(member) {
      if (!member) throw 'Invalid member key: ' + req.session.memberKey;
      var events = [];
      var self = req.session.fleet;
      var previous = _.clone(member.toObject());

      member.shipType = self.shipType;
      member.shipTypeId = self.shipTypeId;
      member.systemName = self.systemName;
      member.systemId = self.systemId;
      member.regionName = self.regionName;
      member.isDocked = self.isDocked;
      
      if (member.isModified()) {
        if (req.session.isLinked) {
          req.session.lastPollTs = moment().unix() - settings.minPollInterval;
          req.session.lastStatusTs = moment().unix() - settings.minPollInterval;
          req.session.fleet = member.toObject(); 
          req.session.fleet.trusted = 'Yes';               

          member.isLinked = true;
        } else {
          var event = Event.prepare('memberUpdated', req.session.fleetKey, member.toObject());
          events.push(event);
          event.saveQ();

        }

        if (!previous.isDocked && !member.isDocked) {
          if (previous.shipType !== 'Capsule' && member.shipType === 'Capsule') {
            var event = Event.prepare('shipLost', req.session.fleetKey, {
              characterName: member.characterName,
              characterId: member.characterId,
              shipTypeName: previous.shipType,
              shipTypeId: previous.shipTypeId
            });
            events.push(event);
            event.saveQ();
          }

          if (previous.systemId != member.systemId) {
            if (!member.isLinked) {

              // look up the new system
              System.findQ({ id: {$in: [previous.systemId, member.systemId]} })
                .then(function(results) {
                    if (!results) throw 'Unable to find system.';
                    var previousSystem = _.find(results, function(s) { if (s.id == previous.systemId) return s; });
                    var currentSystem  = _.find(results, function(s) { if (s.id == member.systemId) return s; });
                    
                    // check for an existing link of type not wormhole
                    Jump.findQ({ $or: [ 
                      {fromSystem: previousSystem.id, toSystem: currentSystem.id},
                      {fromSystem: currentSystem.id, toSystem: previousSystem.id} ] })
                      .then(function(results) {
                                              
                        if (results.length) {
                          _.each(results, function(result) {
                            if (result.type() == 'wormhole') {
                              result.updated_at = moment().unix();
                              result.saveQ();
                            }
                          });

                          // else continue
                        } else {
                          // this is a new connection, first check if the ship is jump capable

                          if (!Ship.is_jumpcapable(member.shipType)) {
                            // setup a bi-directional link between the two systems
                            var jump_a = {toSystem: currentSystem.id, fromSystem: previousSystem.id,
                                          toRegion: currentSystem.regionID, fromRegion: previousSystem.regionID,
                                          toConstellation: currentSystem.constellationID, fromConstellation: previousSystem.constellationID,
                                          updated_at: moment().unix()};
                            var jump_b = {toSystem: previousSystem.id, fromSystem: currentSystem.id,
                                          toRegion: previousSystem.regionID, fromRegion: currentSystem.regionID,
                                          toConstellation: previousSystem.constellationID, fromConstellation: currentSystem.constellationID,
                                          updated_at: moment().unix()};
                                        
                            var wormhole_data = {mass_estimate: 'Unknown', lifespan_estimate: 'Unknown', 
                                                 reporterId: member.characterId, reporterName: member.characterName,
                                                 discovered_on: moment().unix(), expires_on: moment().add(24, 'hours').unix()};

                            var report = Report.prepare('wormhole', req.session.fleetKey, {
                              reporterId: member.characterId,
                              reporterName: member.characterName,
                              data: [_.merge({}, jump_a, jump_b, wormhole_data)]
                            });
                            
                            var tasks = [
                              Jump.updateQ({toSystem: jump_a.toSystem, fromSystem: jump_a.fromSystem},
                                           {$set: jump_a, $setOnInsert: {wormhole_data: wormhole_data}}, {upsert: true}),
                              Jump.updateQ({toSystem: jump_b.toSystem, fromSystem: jump_b.fromSystem},
                                           {$set: jump_b, $setOnInsert: {wormhole_data: wormhole_data}}, {upsert: true}),
                              report.saveQ()
                            ];

                            Q.all(tasks)
                              .then(function(jump) {
                                advisory_a = Advisory.format(req.session.fleetKey, 
                                                            (currentSystem.is_wspace()) ? previousSystem.id : currentSystem.id, 
                                                            'Wormhole Detected');
                                advisory_b = Advisory.format(req.session.fleetKey, 
                                                            (previousSystem.is_wspace()) ? currentSystem.id : previousSystem.id, 
                                                            'Wormhole Detected');
                               
                                Advisory.updateQ({type: advisory_a.type, systemId: advisory_a.systemId}, advisory_a, {upsert: true});
                                Event.prepare('addAdvisory', req.session.fleetKey, advisory_a).saveQ();
                                Advisory.updateQ({type: advisory_b.type, systemId: advisory_b.systemId}, advisory_b, {upsert: true});
                                Event.prepare('addAdvisory', req.session.fleetKey, advisory_b).saveQ();
                               });
                          }
                          
                        }
                        
                      });
                    
                })
                .done(function() {
                  var event = Event.prepare('updateSystemMap', req.session.fleetKey,
                              {
                                characterName: member.characterName,
                                characterId: member.characterId,
                                systemName: member.systemName,
                                systemId: member.systemId
                              });
                  events.push(event);
                  event.saveQ();

                });

            }
          }
        }
      }

      if ( !req.session.isLinked ) {
        member.ts = moment().unix();
        member.saveQ();
      }

      return events;
    }),
    Event.find({$or: [{fleetKey: req.session.fleetKey}, {fleetKey: 'all'}], ts: { $lte: moment().unix(), $gte: +req.params.lastPollTs }})
      .sort({date: 'descending'})
      .execQ()
      .then(function(events) {
        return events;
      })
  ];

  Q.all(tasks)
    .then(function(events) {
      return response.success(res, _.flatten(events, true));
    })
    .catch(function(error) {
      return response.error(res, 'state', 'Error fetching fleet poll: ' + error);
    })
    .done();

};

exports.create = function(req, res, next) {

  if (req.session.fleetKey || req.session.memberKey) { 
    return response.error(res, 'state', 'Please leave your current fleet before creating a new one');
  }

  var name = req.body.name || false;
  if ( !name ) { return response.error(res, 'create', 'Fleets must be created with a name.'); }
  var password = req.body.password || false;
  var description = req.body.description || 'Ad-hoc fleet';

  if ( password &&
     ( password.length > settings.fleetPasswordMaxLength || password.length < settings.fleetPasswordMinLength)) {

    return response.error(res, 'create',
      'Invalid password. Must consist of ' + settings.fleetPasswordMinLength + ' to ' + settings.fleetPasswordMaxLength + ' characters.');
  }

  var fleet = new Fleet({name: name, password: password, description: description});

  fleet.saveQ()
    .then(function(result) {
      return response.success(res, result.toObject());
    })
    .catch(function(error) {
      console.log(error);
      return response.error(res, 'state', 'Error creating fleet');
    })
    .done();

};

exports.report = function(req, res, next) {
  var report = Report.prepare('report', req.session.fleetKey, req.body);
  if (!report.data.length) return response.error(res, 'report', 'Invalid report data.');

  if (report.operation === 'clear') {
    Hostile.updateQ({systemId: report.systemId}, {systemId: null, systemName: null, is_faded: true}, {upsert: true, multi: true})
      .then(function(hostiles) {        
        var event = Event.prepare('reportClear', report.fleetKey, report.toObject());
        event.saveQ();
        report.saveQ();

        return response.success(res, event);
      })
      .catch(function(error) {
        console.log(error);
        return response.error(res, 'report', 'Error reporting system clear');
      })
      .done();
  } else {
    report.parse_standings(req.app.settings.whitelist)
      .then(function(hostiles) {
        
        Q.all(_.map( _.filter(hostiles, function(h) { return h !== false; }), function(hostile) {
          var batch = Q.defer();

          hostile.systemId = report.systemId;
          hostile.systemName = report.systemName;

          Hostile.findOneAndUpdateQ({characterId: hostile.characterId}, hostile, {upsert: true})
            .then(function(result) {
              if (!result) throw 'Error updating hostile: ' + hostile.characterName;

              report.hostiles.push(result.toObject());
              report.saveQ();
              batch.resolve(result.toObject());
            })
            .catch(function(error) {
              batch.reject(error);
            })
            .done();

            return batch.promise;
          })
        )
        .then(function(hostiles) {
          Event.prepare('reportHostile', report.fleetKey, hostiles).saveQ();

          return response.success(res);
        })
        .catch(function(error) {
          console.log(error);
          return response.error(res, 'report', 'Error reporting status: ' + error);
        })
        .done();

      })
      .catch(function(error) {
        console.log(error);
        return response.error(res, 'report', 'Error reporting status: ' + error);
      })
      .done();

  }
};

exports.add_scan = function(req, res, next) {

  Member.findOneQ({key: req.session.memberKey})
    .then(function(reporter) {
      var scan = Scan.prepare(reporter.fleetKey, reporter, req.body);

      if (!scan) throw 'Invalid scan data.';
      if (!scan.shipTypes.length) return response.error(res, 'report', 'Invalid scan data.');
      if (!scan.shipClasses.length) return response.error(res, 'report', 'Invalid scan data.');

      var event = Event.prepare('scanPosted', reporter.fleetKey, scan.toObject());
      scan.saveQ();
      event.saveQ();

      return response.success(res);
    })
    .catch(function(error) {
      console.log(error);
      return response.error(res, 'report', 'Error reporting scan: ' + error);
    })
    .done();

};

exports.update_hostile = function(req, res, next) {
  var update_data = req.body;

  if (!update_data.is_docked) {
    if (!update_data.shipType) return response.error(res, 'report', 'Invalid hostile details');
  }

  var hostile = Hostile.prepare(req.session.fleetKey, req.session.fleet, update_data);
  if (!hostile) return response.error(res, 'report', 'Invalid hostile details: ' + update_data);
  if (settings.ships[ update_data.shipType ]) hostile.shipTypeId = settings.ships[ hostile.shipType ].id;

  Hostile.updateQ({key: hostile.key}, hostile.toObject(), {upsert: true})
    .then(function(result) {
      if (!result) throw 'Hostile not found: ' + hostile.characterName;

      Hostile.findOneQ({key: hostile.key})
        .then(function(updated_hostile) {
          if (!updated_hostile) throw 'Invalid hostile key: ' + hostile.key;
          Event.prepare('updateHostile', req.session.fleetKey, updated_hostile.toObject()).saveQ();

          return response.success(res);
        });
    })
    .catch(function(error) {
      console.log(error);
      return response.error(res, 'report', 'Error updating hostile: ' + error);
    })
    .done();
};

exports.update_advisory = function(req, res, next) {
  var advisory = req.body;

  if (advisory.state == 'true') {
    delete advisory.state;
    advisory = Advisory.format(req.session.fleetKey, advisory.systemId, advisory.type);

    Advisory.updateQ({type: advisory.type, systemId: advisory.systemId}, advisory, {upsert: true})
      .then(function(result) {
        if (result === null) throw 'Advisory failed to save';
        Event.prepare('addAdvisory', req.session.fleetKey, req.body).saveQ();

        return response.success(res);
      })
      .catch(function(error) {
        console.log("ERROR: " + error);
        return response.error(res, 'advisory', 'Error reporting advisory');
      });

  } else {
    delete advisory.state;
    Advisory.removeQ(advisory)
      .then(function(result) {
        if (result === null) throw 'Advisory failed to delete';
        Event.prepare('clearAdvisory', req.session.fleetKey, req.body).saveQ();

        return response.success(res);
      })
      .catch(function(error) {
        console.log(error);
        return response.error(res, 'advisory', 'Error reporting advisory');
      });

  }


};
