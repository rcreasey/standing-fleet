var mongoose = require('mongoose-q')()
  , Schema = mongoose.Schema
  , moment = require('moment')
  , key_generator = require(__dirname + '/../util/key-generator')

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
  is_docked: { type: Boolean, default: false }
});

HostileSchema.index({ ts: 1, key: 1, fleetKey: 1 });

HostileSchema.statics.prepare = function prepare(fleetKey, reporterId, reporterName, character) {
  return new this({
    fleetKey: fleetKey,
    reporterId: reporterId,
    reporterName: reporterName,
    characterId: character.characterID,
    characterName: character.characterName,
    corporationId: character.corporationID,
    corporationName: character.corporationName,
    allianceId: character.allianceID,
    allianceName: character.allianceName
  });
};

HostileSchema.methods.report_update = function report_update(fleetKey, report) {
  this.ts = moment().unix();
  this.fleetKey = fleetKey;
  this.reporterId = report.reporterId;
  this.reporterName = report.reporterName;
  this.systemId = report.systemId;
  this.systemName = report.systemName;

  if (report.shipTypeId !== undefined) this.shipTypeId = report.shipTypeId;
  if (report.shipType !== undefined) this.shipType = report.shipType;

  return;
};

module.exports = mongoose.model('Hostile', HostileSchema);
