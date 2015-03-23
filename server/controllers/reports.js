var response = require(__dirname + '/../response')
  , _ = require('lodash')
  , Q = require('q')
  , Report = require(__dirname + '/../models/report')
  , System = require(__dirname + '/../models/system')

exports.list = function(req, res, next) {

  var tasks = [
    System.find({}, '-_id').lean().execQ(),
    Report.findQ({$or: [{type: 'wormhole'}, {type: 'wormhole_update'}]}, '-_id -__v')
  ];
  
  Q.all(tasks)
    .then(function(results) {
      var reports = [];
      var systems = results[0];
      
      _.each(results[1], function(result) { 
        var report = {
          type: result.type,
          toSystemId: result.data[0].toSystem,
          toSystemName: _.find(systems, function(system) { return system.id == result.data[0].toSystem }).name,
          fromSystemId: result.data[0].fromSystem,
          fromSystemName: _.find(systems, function(system) { return system.id == result.data[0].fromSystem }).name,
          reporterId: result.reporterId || '0',
          reporterName: result.reporterName || 'Admin',
          ts: result.ts
        };
        
        if (report.type == 'wormhole_update' && result.data[0].info.match(/Wormhole collapsed/)) report.cleared = true;

        reports.push(report);
      });
      
      return res.jsonp({reports: reports});
    })
    .catch(function(error) {
      return res.render('reports', {error: error});
    })
    .done();

};
