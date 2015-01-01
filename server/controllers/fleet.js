var response = require(__dirname + '/../response')
  , settings = require(__dirname + '/../config/settings')
  , checks = require(__dirname + '/../middleware/checks')
  , header_parser = require(__dirname + '/../middleware/header-parser')
  , Fleet = require(__dirname + '/../models/fleet')
  , Event = require(__dirname + '/../models/event')
  , Member = require(__dirname + '/../models/member')
  , Hostile = require(__dirname + '/../models/hostile')
  , Report = require(__dirname + '/../models/report')
  , Scan = require(__dirname + '/../models/scan')

var moment = require('moment')
  , Q = require('q')
  , _ = require('lodash')

exports.list = function(req, res, next){
  Fleet.find().select('ts key name description').execQ()
    .then(function(fleets) {
      if (fleets) {
        return response.success(res, fleets);
      } else {
        return response.error(res, 'lookup', 'Unable to fetch fleet list.');        
      }
    })
};

exports.join = function(req, res, next){

  Fleet.findOneQ({key: req.params.fleetKey})
    .then(function(fleet) {

      if (fleet.password && req.params.fleetPassword != fleet.password) {
        return response.error(res, 'password', 'Invalid Password');
      }

      var member = Member.prepare(fleet.key, req.session.fleet);
      var event = Event.prepare('memberJoined', fleet.key, member.toObject());

      member.saveQ()
        .then(function(member) {
          member.link_to_session(req.session);
          return event.saveQ();
        })
        .then(function(event) {
          return response.success(res, event);
        })
        .catch(function(error) {
          console.log(error)
          return response.error(res, 'state', 'Error joining fleet');
        })
        .done()

    })
    .catch(function(error) {
      console.log(error)
      return response.error(res, 'state', 'Error joining fleet');
    })
    .done();

};

exports.leave = function(req, res, next){
  var sid = req.session.id;
  var key = req.session.memberKey;

  req.sessionStore.destroy( sid, function(err) {
    delete req.session;
  })

  Member.findOneQ({key: key})
    .then(function(member) {
      if (member) {
        var event = Event.prepare('memberLeft', member.fleetKey, member.toObject());
        event.saveQ();
        member.removeQ();
        
      }
      
      return response.success(res);
    })
    .catch(function(error) {
      console.log(error)
      return response.error(res, 'state', 'Error leaving fleet: ' + error);
    })
    .done();

};

exports.status = function(req, res, next) {
  if (!req.session) return next();
  
  if (!req.session.fleetKey || !req.session.memberKey) {
    var self = Member.prepare('none', header_parser(req))
    var event = Event.prepare('statusSelf', 'none', self.toObject())

    return response.success(res, [ event ]);
  }

  var events = [];
  
  Member.findOneQ({key: req.session.memberKey})
    .then(function(member) {
      if (!member) throw 'Invalid Member key.';            
      events.push( Event.prepare('statusSelf', member.fleetKey, member.toObject()) );

      return Fleet.findOne({key: member.fleetKey}).execQ();
    })
    .then(function(fleet) {
      if (!fleet) throw 'Invalid Fleet.';
      events.push( Event.prepare('statusFleet', fleet.key, fleet.toObject()) );
      
      var tasks = [
        Event.find({fleetKey: fleet.key}).execQ().then(function(events) {
          return Event.prepare('statusEvents', fleet.key, _.map(events, function(event) { return event.toObject(); }));
        }),
        Member.find({fleetKey: fleet.key}).execQ().then(function(members) {
          return Event.prepare('statusMembers', fleet.key, _.map(members, function(member) { return member.toObject(); }));
        }),
        Hostile.find({fleetKey: fleet.key}).execQ().then(function(hostiles) {
          return Event.prepare('statusHostiles', fleet.key, _.map(hostiles, function(hostile) { return hostile.toObject(); }));
        }),
        Scan.find({fleetKey: fleet.key}).execQ().then(function(scans) {
          return Event.prepare('statusScans', fleet.key, _.map(scans, function(scan) { return scan.toObject(); }));
        })
      ];

      Q.all(tasks)
        .then(function(results) {
          _.each(results, function(result) { events.push(result); });
          return response.success(res, events);
        })
        .catch(function(error) {
          console.log(error)
          req.sessionStore.destroy( req.session.id, function(err) {
            delete req.session;
          });
          
          return response.error(res, 'status', 'Error fetching fleet tasks.');
        })
        .done();
    })
    .catch(function(error) {
      console.log(error)
      req.sessionStore.destroy( req.session.id, function(err) {
        delete req.session;
      });
      
      return response.error(res, 'status', 'Error fetching fleet status.');
    })
    .done();

};

exports.poll = function(req, res, next) {
  if (!req.session.fleetKey || !req.session.memberKey) {
    return response.error(res, 'state', 'Error fetching fleet poll.');
  }

  var tasks = [
    Member.findOne({key: req.session.memberKey}).execQ().then(function(member) {
      var events = [];
      var self = req.session.fleet;
      var previous = _.clone(member.toObject())

      member.shipType = self.shipType;
      member.shipTypeId = self.shipTypeId;
      member.systemName = self.systemName;
      member.systemId = self.systemId;
      member.regionName = self.regionName;
      member.isDocked = self.isDocked;

      if (member.isModified()) {
        if (req.session.linked) {
          delete req.session.linked;

          req.session.linked = member.toObject();
          req.session.linked.trusted = 'Yes';
          req.session.linked.isLinked = true;
          member.isLinked = true;
        } else {
          var event = Event.prepare('memberUpdated', req.session.fleetKey, member.toObject());
          events.push(event);
          event.saveQ();

        }

        if (!previous.isDocked && !member.isDocked) {
          if (previous.shipType != 'Capsule' && member.shipType == 'Capsule') {
            var event = Event.prepare('shipLost', req.session.fleetKey, {
              characterName: member.characterName,
              characterId: member.characterId,
              shipTypeName: previous.shipType,
              shipTypeId: previous.shipTypeId
            });
            events.push(event);
            event.saveQ();
          }
        }

        if (previous.systemId != member.systemId) {
          if (!member.isLinked) {
            var event = Event.prepare('updateSystemMap', req.session.fleetKey,
                        {
                          characterName: member.characterName,
                          characterId: member.characterId,
                          systemName: member.systemName,
                          systemId: member.systemId
                        })
            events.push(event);
            event.saveQ();
          }
        }
      }

      if ( !req.session.linked ) {
        member.ts = moment().unix();
        member.saveQ();        
      }
      
      return events;
    }),
    Event.find({fleetKey: req.session.fleetKey, ts: { $lte: moment().unix(), $gte: +req.params.lastPollTs }})
      .sort({date: 'descending'}).execQ().then(function(events) {
      return events;
    })
  ];

  Q.all(tasks)
    .then(function(events) {
      return response.success(res, _.flatten(events, true));
    })
    .catch(function(error) {
      console.log(error)
      return response.error(res, 'state', 'Error fetching fleet poll.');
    })
    .done();

};

exports.create = function(req, res, next) {
  if (req.session.fleetKey || req.session.memberKey) return response.error(res, 'state', 'Please leave your current fleet before creating a new one');

  var fleetName = req.body.fleetName || false;
  if ( !fleetName ) {
    return response.error(res, 'create', 'Fleets must be created with a name.');    
  }
  
  var fleetPassword = req.body.fleetPassword || false;

  if ( fleetPassword &&
     ( fleetPassword.length > settings.fleetPasswordMaxLength
    || fleetPassword.length < settings.fleetPasswordMinLength)) {

    return response.error(res, 'create',
      'Invalid password. Must consist of ' + settings.fleetPasswordMinLength + ' to ' + settings.fleetPasswordMaxLength + ' characters.');
  }

  var fleet = Fleet.prepare(fleetName, fleetPassword);
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
      response.success(res, Event.prepare('fleetCreated', 'none', fleet.toObject()));
    })
    .catch(function(error) {
      console.log(error)
      return response.error(res, 'state', 'Error creating fleet');
    })
    .done();

};

exports.report = function(req, res, next) {
  var report = Report.prepare(req.session.fleetKey, req.body);
  if (!report.data.length) return response.error(res, 'report', 'Invalid report data.');

  if (report.text === 'clear') {
    Hostile.removeQ({systemId: report.systemId})
      .then(function(hostile) {
        var event = Event.prepare('reportClear', report.fleetKey, report.toObject());
        event.saveQ();

        return response.success(res, event);
      })
      .catch(function(error) {
        console.log(error)
        return response.error(res, 'report', 'Error reporting system clear');
      })
      .done();
  } else {    
    report.parse_standings(req.app.settings.whitelist)
      .then(function(hostiles) {
        
        Q.all(_.map(hostiles, function(hostile) {
          var batch = Q.defer();
          
          Hostile.findOneQ({fleetKey: report.fleetKey, characterId: hostile.characterId})
            .then(function(result) {
              if (result !== null) hostile = result;
              hostile.report_update(report.fleetKey, report);              
              report.hostiles.push(hostile);
              hostile.saveQ();
              
              batch.resolve(hostile.toObject());
            })
            .catch(function(error) {
              batch.reject(error)
            })
            .done();
          
            return batch.promise;
          })
        )
        .then(function(updated) {          
          report.hostiles = updated;
          report.saveQ();
          
          event = Event.prepare('reportHostile', report.fleetKey, updated);
          event.saveQ();

          return response.success(res);
        })
        .catch(function(error) {
          console.log(error)
          throw 'Error updating hostile: ' + error;
        })
        .done()

      })
      .catch(function(error) {
        console.log(error)
        return response.error(res, 'report', 'Error reporting status: ' + error);
      })
      .done()
  }
};

exports.add_scan = function(req, res, next) {

  Member.findOneQ({key: req.session.memberKey})
    .then(function(reporter) {
      var scan = Scan.prepare(reporter.fleetKey, reporter, req.body);

      if (!scan.shipTypes.length) return response.error(res, 'report', 'Invalid scan data.');
      if (!scan.shipClasses.length) return response.error(res, 'report', 'Invalid scan data.');

      var event = Event.prepare('scanPosted', reporter.fleetKey, scan.toObject());
      scan.saveQ();
      event.saveQ();

      return response.success(res);
    })
    .catch(function(error) {
      console.log(error)
      return response.error(res, 'report', 'Error reporting scan: ' + error);
    })
    .done();

};

exports.update_hostile = function(req, res, next) {

  var scan_data = req.body;

  if (!scan_data.shipType) return response.error(res, 'details', 'Invalid hostile details');
  if (!settings.ships[ scan_data.shipType ]) return response.error(res, 'details', 'Invalid ship type: ' + scan_data.shipType );

  Hostile.findOneQ({key: scan_data.key, fleetKey: req.session.fleetKey})
    .then(function(hostile) {

      if (hostile !== null) {
        hostile.shipType = req.body.shipType;
        hostile.shipTypeId = settings.ships[ scan_data.shipType ].id;
        hostile.reporterId = req.session.fleet.characterId;
        hostile.reporterName = req.session.fleet.characterName;

        var event = Event.prepare('updateHostile', req.session.fleetKey, hostile.toObject());

        hostile.saveQ();
        event.saveQ();

        return response.success(res);
      } else {
        throw 'Hostile not found (' + scan_data.name + ')';
      }

    })
    .catch(function(error) {
      console.log(error)
      return response.error(res, 'report', 'Error updating hostile: ' + error);
    })
    .done();
};
