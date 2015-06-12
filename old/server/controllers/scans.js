var response = require(__dirname + '/../response')
  , moment = require('moment')
  , Scan = require(__dirname + '/../models/scan')
  , Region = require(__dirname + '/../models/region')
  , System = require(__dirname + '/../models/system')

exports.show = function(req, res, next) {
  var id = req.params.id;

  Scan.findOneQ({_id: id})
    .then(function(scan) {
      if (scan === null) throw 'Invalid Scan ID \'' + id + '\'';

      return scan.toObject();
    })
    .then(function(scan) {
      System.findOneQ({id: scan.systemId})
        .then(function(system) {
          if (!system) throw 'Error looking up system';
          return [ scan, system.toObject() ];
        })
        .spread(function(scan, system) {
          Region.findOneQ({id: system.regionID})
            .then(function(region) {
              if (!region) throw 'Error looking up region';
              return res.render('scans', {timestamp: moment.unix(scan.ts).format('lll'), scan: scan, region: region, system: system});
            });
        })
        .catch(function(error) {
          console.log(error);
          return res.render('scans', {error: 'Invalid Scan ID'});
        })
        .done();
    })
    .catch(function(error) {
      console.log(error);
      return res.render('scans', {error: 'Invalid Scan ID'});
    })
    .done();

};
