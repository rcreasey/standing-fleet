var mongoose = require('mongoose-q')()
  , Schema = mongoose.Schema
  , moment = require('moment')
  , key_generator = require(__dirname + '/../util/key-generator')
  , settings = require(__dirname + '/../config/settings')

var MemberSchema  = new Schema({
  ts: { type: Number, default: function() { return moment().unix(); } },
  key: { type: String, default: function() { return key_generator.getKey(); } },
  fleetKey: { type: String },
  characterId: Number,
  characterName: String,
  shipType: String,
  shipTypeId: Number,
  regionName: String,
  systemName: String,
  systemId: Number,
  isDocked: Boolean,
  isLinked: { type: Boolean, default: false }
});

MemberSchema.index({ ts: 1, key: 1, fleetKey: 1 }, { expireAfterSeconds: settings.memberTtl });

MemberSchema.methods.link_to_session = function link_to_session(session, next) {
  session.fleetKey = this.fleetKey;
  session.memberKey = this.key;
  session.lastPollTs = moment().unix() - settings.minPollInterval;
  session.lastStatusTs = moment().unix() - settings.minPollInterval;

  if (next) next();
  return;
};

MemberSchema.statics.prepare = function prepare(key, fleet) {
  return new this({
    fleetKey: key,
    characterId: fleet.characterId,
    characterName: fleet.characterName,
    shipType: fleet.shipType,
    shipTypeId: fleet.shipTypeId,
    shipName: fleet.shipName,
    regionName: fleet.regionName,
    systemName: fleet.systemName,
    systemId: fleet.systemId,
    isDocked: fleet.isDocked
  });
};

module.exports = mongoose.model('Member', MemberSchema);
