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
          var locals = { Regions: {}, Systems: {}, Gates: [] }
          locals.Regions[ region.id ] = region;

          _.forEach(systems, function(system) {
            locals.Systems[ system.id ] = system;
          })

          Jump.findQ({ $or: [ {to: {$in: system_ids} }, {from: {$in: system_ids}} ] })
            .then(function(jumps) {
              if (!jumps) throw 'Unable to find jumps for region ' + region.name;

              locals.Gates = _.map(jumps, function(jump) {
                return {
                  to: jump.to,
                  from: jump.from,
                  type: jump.type
                }
              });

              return res.jsonp(locals);
            })
            .done()

        })
        .done()
    })
    .catch(function(error) {
      console.log(error)
      return response.error(res, 'map', error);
    })
    .done();

};

exports.show_system = function(req, res, next){
  var system = {};

  System.findOneQ({name: req.params.system_name}, 'id name constellationID regionID x y')
    .then(function(system) {
      if (!system) throw 'Invalid system name ' + req.params.system_name;

      system = {
        id: system.id,
        name: system.name,
        regionID: system.regionID,
        constellationID: system.constellationID,
        x: system.x,
        y: system.y
      };

      return system;
    })
    .then(function(system) {

      var tasks = [
        Jump.findQ({ $or: [ {to: system.id}, {from: system.id} ] }).then(function(jumps) {
          return _.map(jumps, function(jump) { return {to: jump.to, from: jump.from, type: jump.type} });
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
          var vicinity_ids = _.map(system.jumps, function(jump) { return (system.id !== jump.to) ? jump.to : jump.from; });

          System.findQ({ id: {$in: vicinity_ids} }, 'id name constellationID regionID')
            .then(function(vicinity) {
              system.vicinity = vicinity;
              return res.jsonp(system);
            });

        })
        .catch(function(error) {
          console.log(error)
          return response.error(res, 'map', error);
        })

    })

};
