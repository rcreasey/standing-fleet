var response = require(__dirname + '/../response')
  , _ = require('lodash')
  , Ship = require(__dirname + '/../models/ship')

exports.list = function(req, res, next) {
  
  Ship.findQ()
    .then(function(results) {
      var ships = {};
      
      _.each(results, function(ship) {
        ships[ship.name]= {
          id: ship.id, name: ship.name, class: [ship.class], icons: [ship.class, ship.meta]
        };
      });
      
      return res.jsonp({ships: ships});
    })
    .catch(function(error) {
      console.log(error);
      return response.error(res, 'ships', error);
    })
    .done();
    
};
