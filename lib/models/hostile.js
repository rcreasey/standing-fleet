var mongoose = require('mongoose-q')()
  , Schema = mongoose.Schema
  , moment = require('moment')

var HostileSchema  = new Schema({
  ts: { type: Number, default: function() { return moment().unix(); } },
  key: { type: String, index: true },
  fleetKey: { type: String, index: true },
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
  this.fleetKey = fleetKey;
  this.reporterId = report.reporterId;
  this.reporterName = report.reporterName;
  this.systemId = report.systemId;
  this.systemName = report.systemName;

  if (report.shipTypeId !== null) this.shipTypeId = report.shipTypeId;
  if (report.shipType !== null) this.shipType = report.shipType;

  return;
};

module.exports = mongoose.model('Hostile', HostileSchema);
