var mongoose = require('mongoose-q')()
  , Schema = mongoose.Schema
  , moment = require('moment')
  , key_generator = require(__dirname + '/../util/key-generator')
  , System = require('./system')
  , settings = require(__dirname + '/../config/settings')
  
var HostileSchema  = new Schema({
  ts: { type: Number, default: function() { return moment().unix(); } },
  key: { type: String, default: function() { return key_generator.getKey(); } },
  fleetKey: { type: String },
  characterId: Number,
  characterName: String,
  corporationId: Number,
  corporationName: String,
  allianceId: Number,
  allianceName: String,
  shipType: String,
  shipTypeId: Number,
  shipName: String,
  systemId: Number,
  systemName: String,
  reporterId: Number,
  reporterName: String,
  is_faded: { type: Boolean, default: false },
  is_docked: { type: Boolean, default: false }
});

HostileSchema.index({ ts: 1, key: 1, fleetKey: 1 }, { expireAfterSeconds: settings.hostileRemoveTtl });

HostileSchema.statics.prepare = function prepare(fleetKey, reporter, hostile) {
  return new this({
    fleetKey: fleetKey,
    reporterId: reporter.characterId || reporter.characterID,
    reporterName: reporter.characterName,
    key: hostile.key,
    characterId: hostile.characterId || hostile.characterID,
    characterName: hostile.characterName,
    corporationId: hostile.corporationID,
    corporationName: hostile.corporationName,
    allianceId: hostile.allianceID,
    allianceName: hostile.allianceName,
    shipType: hostile.shipType,
    shipTypeId: hostile.shipTypeId,
    systemId: hostile.systemId,
    systemName: hostile.systemName,
    is_faded: hostile.is_faded,
    is_docked: hostile.is_docked
  }, { versionKey: false });
};

HostileSchema.methods.report_update = function report_update(fleetKey, report) {
  this.ts = moment().unix();
  this.fleetKey = fleetKey;
  this.reporterId = report.reporterId;
  this.reporterName = report.reporterName;
  this.systemId = report.systemId;
  this.systemName = report.systemName;
  this.is_faded = false;

  if (report.shipTypeId !== undefined) this.shipTypeId = report.shipTypeId;
  if (report.shipType !== undefined) this.shipType = report.shipType;

  return;
};

module.exports = mongoose.model('Hostile', HostileSchema);
