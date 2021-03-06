var Q = require('q')
  , _ = require('lodash')
  , moment = require('moment')
  , response = require(__dirname + '/../response')
  , Advisory = require(__dirname + '/../models/advisory')
  , Event = require(__dirname + '/../models/event')
  , Region = require(__dirname + '/../models/region')
  , System = require(__dirname + '/../models/system')
  , Jump = require(__dirname + '/../models/jump')
  , Report = require(__dirname + '/../models/report')
  , Hostile = require(__dirname + '/../models/hostile')
  , Traversal = require(__dirname + '/../models/traversal')
  
  
exports.show_regions = function(req, res, next) {
  Region.find({})
    .cache(true, 3600)
    .execQ()
    .then(function(results) {
      return res.jsonp({regions: results});
    })
    .catch(function(error) {
      console.log(error);
      return response.error(res, 'map', error);
    })
    .done();
};

exports.show_region = function(req, res, next) {

  Region.findOneQ({name: req.params.region_name})
    .then(function(result) {
      if (!result) throw 'Invalid region name ' + req.params.region_name;
      var region = {
        id: result.id,
        name: result.name
      };
      
      if (result.bounds) {
        region.top = result.bounds.top;
        region.right = result.bounds.right;
        region.bottom = result.bounds.bottom;
        region.left = result.bounds.left;
      }
      
      return region;
    })
    .then(function(region) {
      System.findQ({regionID: region.id})
        .then(function(systems) {
          if (!systems) throw 'Unable to find systems for region ' + region.name;
          return [  region,
                    _.map(systems, function(system) {
                      return {
                        id: system.id,
                        name: system.name,
                        regionID: system.regionID,
                        constellationID: system.constellationID,
                        x: system.x,
                        y: system.y
                      };
                    }),
                    _.map(systems, function(system) {
                      return system.id;
                    })
                ];
        })
        .spread(function(region, systems, system_ids) {
          var locals = { regions: {}, systems: {}, jumps: [] };
          locals.regions[ region.id ] = region;

          _.forEach(systems, function(system) {
            locals.systems[ system.id ] = system;
          });

          Jump.findQ({ $or: [ {toSystem: {$in: system_ids} }, {fromSystem: {$in: system_ids}} ] }, '-_id')
            .then(function(jumps) {
              if (!jumps) throw 'Unable to find jumps for region ' + region.name;

              locals.jumps = _.filter(jumps, function(j) { return j.toObject().wormhole_data === undefined; });
              locals.wormholes = _.filter(jumps, function(j) { return j.toObject().wormhole_data !== undefined; });

              return res.jsonp(locals);
            })
            .done();

        })
        .done();
    })
    // .catch(function(error) {
    //   console.log(error);
    //   return response.error(res, 'map', error);
    // })
    // .done();

};

exports.show_system = function(req, res, next){
  var system = {};

  System.findOne({name: req.params.system_name})
    .lean()
    .cache(true, 5)
    .execQ()
    .then(function(result) {
      if (!system) throw 'Invalid system name ' + req.params.system_name;

      system = {
        id: result.id,
        name: result.name,
        regionID: result.regionID,
        constellationID: result.constellationID,
        security: result.security,
        x: result.x,
        y: result.y
      };
      
      if (result.security_class) system.security_class = result.security_class;
      if (result.wormhole_class) system.wormhole_class = result.wormhole_class;

      return system;
    })
    .then(function(system) {

      var tasks = [
        Jump.find({ $or: [ {toSystem: system.id}, {fromSystem: system.id} ] }, '-_id')
          .cache(true, 5)
          .execQ().then(function(jumps) { return jumps; }),          
        Report.find({systemId: system.id})
          .cache(true, 5)
          .execQ().then(function(reports) { return reports; }),
        Advisory.find({systemId: system.id})
          .cache(true, 5)
          .execQ().then(function(advisories) { return advisories; }),
        Hostile.find({systemId: system.id})
          .cache(true, 5)
          .execQ().then(function(hostiles) { return hostiles; })
      ];

      Q.all(tasks)
        .then(function(results) {
          system.jumps = results[0];
          system.reports = _.map(results[1], function(report) { return report.toObject(); });
          system.advisories = results[2];
          system.hostiles = _.map(results[3], function(hostile) { return hostile.toObject(); });

          return system;
        })
        .then(function(system) {
          var plus_one = _.unique( _.flatten( _.map(system.jumps, function(jump) { return [jump.toSystem, jump.fromSystem]; }) ));

          Jump.find({ $or: [ {toSystem: {$in: plus_one}}, {fromSystem: {$in: plus_one}} ] }, '-_id')
            .cache(true, 5)
            .execQ()
            .then(function(result) {
              plus_two = _.unique( _.flatten( _.map(result, function(jump) { return [jump.toSystem, jump.fromSystem]; }) ));

              System.find({ id: {$in: _.union(plus_one, plus_two)} }, '-_id id name constellationID regionID')
                .sort('name')
                .cache(true, 5)
                .execQ()
                .then(function(vicinity) {
                  system.vicinity = vicinity;
                  return res.jsonp(system);
                });

            });

        })
        .catch(function(error) {
          console.log(error);
          return response.error(res, 'map', error);
        });

    })
    .catch(function(error) {
      console.log(error);
      return response.error(res, 'map', error);
    });


};

exports.vicinity = function(req, res, next){
  var vicinity = {regions: {}, systems: {}, jumps: []};
  var region_name = (req.query.regionName === undefined) ? req.session.fleet.regionName : req.query.regionName;
  
  vicinity.current = {systemName: req.session.fleet.systemName, systemId: req.session.fleet.systemId,
                      regionName: region_name};
                      
  // Find the region
  Region.findOne({name: region_name})
    .lean()
    .execQ()
    .then(function(region) {
      if (!region) { throw 'Invalid Region: ' + region_name; }
      vicinity.current.regionId = region.id;
      vicinity.regions[region.id] = region;

      return region;
    })
    .then(function(region) {
      var tasks = [
        System.find({regionID: region.id}, '-_id')
        .cache(true, 5)
        .execQ(),
        Jump.find({ $or: [ {toRegion: region.id}, {fromRegion: region.id} ] }, '-_id -x -y')
        .cache(true, 5)
        .execQ()
      ];

      // Concurrently find the systems and jumps in that region
      Q.all(tasks)
        .then(function(results) {
          var system = _.find(results[0], function(system) { return system.id === vicinity.current.systemId; });          
          vicinity.current.constellationID = (system !== undefined) ? system.constellationID : null;
          
          vicinity.jumps = _.map(results[1], function(jump) {
            return _.merge(jump.toObject(), {'type': jump.type()});              
          });
          
          // filter out wormhole jumps that do not match the current constellation
          vicinity.jumps = _.filter(vicinity.jumps, function(j) {
            if (j.type === 'wormhole') {
              if (j.toConstellation === vicinity.current.constellationID || 
                  j.fromConstellation === vicinity.current.constellationID) {
                    return true;
              } else {
                return false;
              }
                  
            } else {
              return true;
            }
          });
          
          // filter out wormholes that are not connected to anything (other than the current system)
          _.each(results[0], function(system) { 
            if (system.is_wspace()) {
              if (system.id === vicinity.current.systemId || _.contains(vicinity.jumps, system.id) ) {
                vicinity.systems[system.id] = system;               
              }
            } else {
              vicinity.systems[system.id] = system;               
            }
          });

          // Return a list of system ids that are referenced from the jump data
          return _.filter(vicinity.jumps, function(jump) {
            if (jump.toRegion !== region.id) { return jump.toSystem; }
            else if (jump.fromRegion !== region.id) { return jump.fromSystem; }
          });
        })
        .then(function(systems) {
          var system_ids = _.unique( _.flatten( _.map(systems, function(jump) { return [jump.toSystem, jump.fromSystem]; }) ));
          var region_ids = _.unique( _.flatten( _.map(systems, function(jump) { return [jump.toRegion, jump.fromRegion]; }) ));

          var tasks = [
            System.find({ id: {$in: system_ids} })
            .cache(true, 5)
            .execQ(),
            Region.find({ id: {$in: region_ids} })
            .cache(true, 5)
            .execQ()
          ];

          Q.all(tasks)
            .then(function(results) {
              _.each(results[0], function(system) { vicinity.systems[system.id] = system.toObject(); });
              _.each(results[1], function(region) { vicinity.regions[region.id] = region.toObject(); });

              return res.jsonp(vicinity);
            });
        })
        .catch(function(error) {
          console.log(error);
          return response.error(res, 'vicinity', error);
        });

    })
    .catch(function(error) {
      console.log(error);
      return response.error(res, 'map', error);
    });
};

exports.update_jump = function(req, res, next){
  var report = Report.prepare('wormhole_update', req.session.fleetKey, {data: [_.merge({fromSystem: req.params.from_id, toSystem: req.params.to_id}, req.body)]});

  var tasks = [
    Jump.updateQ({fromSystem: req.params.from_id, toSystem: req.params.to_id}, 
                 {$set: Jump.parseWormholeInfo(req.body.sig_a, req.body.type_a, req.body.info)}),
    Jump.updateQ({fromSystem: req.params.to_id, toSystem: req.params.from_id}, 
                 {$set: Jump.parseWormholeInfo(req.body.sig_b, req.body.type_b, req.body.info)}),
    report.saveQ()
  ];
  
  Q.all(tasks)
    .then(function(result) {
      if (result[0] && result[1]) {
        Event.prepare('refreshSystems', 'all').saveQ();
        return response.success(res);
      } else {
        throw 'Unable to update jump data.';
      }
    })
    .catch(function(error) {
      console.log(error);
      return response.error(res, 'map', error);
    })
    .done(function() {
      next();
    });
};

exports.update_traversal = function(req, res, next) {
  Report.prepare('wormhole_traversal', req.session.fleetKey, {data: [_.merge({fromSystem: req.params.from_id, toSystem: req.params.to_id}, req.body)]})
    .saveQ();

  var traversal = new Traversal(req.body);
  
  Jump.findQ({ $or: [{toSystem: req.params.to_id, fromSystem: req.params.from_id}, {toSystem: req.params.from_id, fromSystem: req.params.to_id}] })
    .then(function(jumps) {

      _.each(jumps, function(jump) { 
        jump.wormhole_data.traversals.push( traversal ); 
        return jump.saveQ();
      });
    })
    .catch(function(error) {
      return response.error(res, 'traversal', error);
    })
    .done(function() {
      return response.success(res);
    });

};

exports.show_wormholes = function(req, res, next) {
  Jump.findQ({"wormhole_data": {$ne: null}}, '-_id')
    .then(function(results) {
      return [
        _.map(results, function(jump) { return _.merge(jump.toObject(), {'type': jump.type()}); }),
        _.unique( _.flatten( _.map(results, function(j) { return [ j.toSystem, j.fromSystem ]; }) )),
        _.unique( _.flatten( _.map(results, function(j) { return [ j.toRegion, j.fromRegion ]; }) ))
      ];
    })
    .spread(function(jumps, systems, regions) {
      var locals = { regions: {}, systems: {}, jumps: jumps };
      
      var tasks = [
        System.find({id: { $in: systems }}, '-_id').execQ(),
        Region.find({id: { $in: regions }}, '-_id').execQ(),
      ];

      Q.all(tasks)
        .then(function(results) {
          _.each(results[0], function(system) { locals.systems[system.id] = system.toObject(); });
          _.each(results[1], function(region) { locals.regions[region.id] = region.toObject(); });
          
          return res.jsonp(locals);
        });

    })
    .catch(function(error) {
      console.log(error);
      return response.error(res, 'map', error);
    })
    .done();
};
