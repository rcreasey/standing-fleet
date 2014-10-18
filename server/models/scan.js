var mongoose = require('mongoose-q')()
  , Schema = mongoose.Schema
  , moment = require('moment')
  , key_generator = require(__dirname + '/../util/key-generator')

var ScanSchema  = new Schema({
  ts: { type: Number, default: function() { return moment().unix(); }, expires: '1h' },
  key: { type: String, index: true, default: function() { return key_generator.getKey(); } },
  fleetKey: { type: String, index: true },

  reporterId: Number,
  reporterName: String,

  systemId: Number,
  systemName: String,

  shipTypes: [ Schema.Types.Mixed ],
  shipClasses: [ Schema.Types.Mixed ]
});

ScanSchema.statics.prepare = function prepare(fleetKey, reporter, scan) {
  return new this({
    fleetKey: fleetKey,
    reporterId: reporter.characterId,
    reporterName: reporter.characterName,
    systemId: reporter.systemId,
    systemName: reporter.systemName,
    shipTypes: scan.types || [],
    shipClasses: scan.classes || []
  });
};

module.exports = mongoose.model('Scan', ScanSchema);
