var Q = require('q')
  , _ = require('lodash')
  , response = require(__dirname + '/../response')
  , Advisory = require(__dirname + '/../models/advisory')
  , Region = require(__dirname + '/../models/region')
  , System = require(__dirname + '/../models/system')
  , Jump = require(__dirname + '/../models/jump')
  , Report = require(__dirname + '/../models/report')
  , Hostile = require(__dirname + '/../models/hostile')

exports.show_region = function(req, res, next){

  Region.findOneQ({name: req.params.region_name})
    .then(function(region) {
      if (!region) throw 'Invalid region name ' + req.params.region_name;
      return {
        id: region.id,
        name: region.name,
        bounds: {
          left: region.bounds.left,
          top: region.bounds.top,
          bottom: region.bounds.bottom,
          right: region.bounds.right
        }
      };
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
          locals.tegions[ region.id ] = region;

          _.forEach(systems, function(system) {
            locals.systems[ system.id ] = system;
          });

          Jump.findQ({ $or: [ {to: {$in: system_ids} }, {from: {$in: system_ids}} ] })
            .then(function(jumps) {
              if (!jumps) throw 'Unable to find jumps for region ' + region.name;

              locals.jumps = _.map(jumps, function(jump) {
                return {
                  to: jump.to,
                  from: jump.from,
                  type: jump.type
                };
              });

              return res.jsonp(locals);
            })
            .done();

        })
        .done();
    })
    .catch(function(error) {
      console.log(error);
      return response.error(res, 'map', error);
    })
    .done();

};

exports.show_system = function(req, res, next){
  var system = {};

  System.findOneQ({name: req.params.system_name})
    .then(function(result) {
      if (!system) throw 'Invalid system name ' + req.params.system_name;

      system = {
        id: result.id,
        name: result.name,
        regionID: result.regionID,
        constellationID: result.constellationID,
        security_class: result.security_class,
        security: result.security,
        x: result.x,
        y: result.y
      };
      
      if (result.wormhole_data) {
        if (result.wormhole_data.effectName) system.wormhole_effect = result.wormhole_data.effectName;
        if (result.wormhole_data.class) system.wormhole_class = result.wormhole_data.class;
      }

      return system;
    })
    .then(function(system) {

      var tasks = [
        Jump.findQ({ $or: [ {toSystem: system.id}, {fromSystem: system.id} ] }).then(function(jumps) {
          return _.map(jumps, function(jump) { return {to: jump.toSystem, from: jump.fromSystem, type: jump.type}; });
        }),
        Report.findQ({systemId: system.id}).then(function(reports) { return reports; }),
        Advisory.findQ({systemId: system.id}).then(function(advisories) { return advisories; }),
        Hostile.findQ({systemId: system.id}).then(function(hostiles) { return hostiles; })
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
          var plus_one = _.unique( _.flatten( _.map(system.jumps, function(jump) { return [jump.to, jump.from]; }) ));

          Jump.findQ({ $or: [ {to: {$in: plus_one}}, {from: {$in: plus_one}} ] })
            .then(function(result) {

              plus_two = _.unique( _.flatten( _.map(result, function(jump) { return [jump.to, jump.from]; }) ));

              System.find({ id: {$in: _.union(plus_one, plus_two)} }, 'id name constellationID regionID')
              .sort('name')
              .execQ()
              .then(function(vicinity) {
                system.vicinity = vicinity;
                return res.jsonp(system);
              });

            })

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
  vicinity.current = {systemName: req.session.fleet.systemName, systemId: req.session.fleet.systemId,
                      regionName: req.session.fleet.regionName};

  // Find the region
  Region.findOneQ({name: req.session.fleet.regionName})
    .then(function(region) {
      if (!region) throw 'Invalid Region: ' + req.session.fleet.regionName;
      vicinity.current.regionId = region.id;
      vicinity.regions[region.id] = region.toObject();

      return region.toObject();
    })
    .then(function(region) {
      var tasks = [
        System.findQ({regionID: region.id}),
        Jump.findQ({ $or: [ {toRegion: region.id}, {fromRegion: region.id} ] })
      ];

      // Concurrently find the systems and jumps in that region
      Q.all(tasks)
        .then(function(results) {
          _.each(results[0], function(system) { vicinity.systems[system.id] = system; });
          vicinity.jumps = _.map(results[1], function(jump) { return _.merge(jump.toObject(), {'type': jump.type()}); });

          // Return a list of system ids that are referenced from the jump data
          return _.filter(vicinity.jumps, function(jump) {
            if (jump.toRegion != region.id) return jump.toSystem;
            else if (jump.fromRegion != region.id) return jump.fromSystem;
          });
        })
        .then(function(systems) {
          var system_ids = _.unique( _.flatten( _.map(systems, function(jump) { return [jump.toSystem, jump.fromSystem]; }) ));
          var region_ids = _.unique( _.flatten( _.map(systems, function(jump) { return [jump.toRegion, jump.fromRegion]; }) ));

          var tasks = [
            System.findQ({ id: {$in: system_ids} }),
            Region.findQ({ id: {$in: region_ids} })
          ];

          Q.all(tasks)
            .then(function(results) {
              _.each(results[0], function(system) { vicinity.systems[system.id] = system.toObject(); });
              _.each(results[1], function(region) { vicinity.regions[region.id] = region.toObject(); });

              return res.jsonp(vicinity);
            });
        });

    })
    .catch(function(error) {
      console.log(error);
      return response.error(res, 'map', error);
    });


};
