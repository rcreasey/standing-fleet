var mongoose = require('mongoose-q')()
  , Schema = mongoose.Schema
  , moment = require('moment')
  , settings = require(__dirname + '/../../config/settings')
  , key_generator = require(__dirname + '/../util/key-generator')

var MemberSchema  = new Schema({
  ts: { type: Number, default: function() { return new Date().getTime(); } },
  key: { type: String, index: true, default: function() { return key_generator.getKey(); } },
  fleetKey: { type: String, index: true },
  characterId: Number,
  characterName: String,
  shipType: String,
  shipTypeId: Number,
  systemName: String,
  systemId: Number,
  isDocked: Boolean
});

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
    systemName: fleet.systemName,
    systemId: fleet.systemId,
    isDocked: fleet.isDocked
  });
};

module.exports = mongoose.model('Member', MemberSchema);
