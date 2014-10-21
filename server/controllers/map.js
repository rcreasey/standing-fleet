var Q = require('q')
  , _ = require('lodash')
  , response = require(__dirname + '/../response')
  , Region = require(__dirname + '/../models/region')
  , System = require(__dirname + '/../models/system')
  , Jump = require(__dirname + '/../models/jump')

exports.show = function(req, res, next){

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
