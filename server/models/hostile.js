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
    ts: moment().unix(),
    key: hostile.key || key_generator.getKey(),
    fleetKey: fleetKey,

    reporterId: reporter.characterId || reporter.characterID,
    reporterName: reporter.characterName,

    characterId: hostile.characterId || hostile.characterID,
    characterName: hostile.characterName,
    corporationId: hostile.corporationID,
    corporationName: hostile.corporationName,
    allianceId: hostile.allianceID,
    allianceName: hostile.allianceName,
    shipType: hostile.shipType,
    shipTypeId: hostile.shipTypeId,

    is_faded: false,
    is_docked: false
  }, { versionKey: false });
};

module.exports = mongoose.model('Hostile', HostileSchema);
