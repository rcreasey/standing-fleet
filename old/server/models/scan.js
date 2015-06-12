var mongoose = require('mongoose-q')()
  , Schema = mongoose.Schema
  , moment = require('moment')
  , key_generator = require(__dirname + '/../util/key-generator')
  , settings = require(__dirname + '/../config/settings')

var ScanSchema  = new Schema({
  ts: { type: Number, default: function() { return moment().unix(); }, expires: '1h' },
  key: { type: String, default: function() { return key_generator.getKey(); } },
  fleetKey: { type: String },
  reporterId: Number,
  reporterName: String,
  systemId: Number,
  systemName: String,
  shipTypes: [ Schema.Types.Mixed ],
  shipClasses: [ Schema.Types.Mixed ]
});

ScanSchema.index({ ts: 1, key: 1, fleetKey: 1 }, { expireAfterSeconds: settings.scanTtl });

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
