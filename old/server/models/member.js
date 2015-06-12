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
  isDocked: Boolean
});

MemberSchema.index({ ts: 1, key: 1, fleetKey: 1 }, { expireAfterSeconds: settings.memberTtl });

MemberSchema.statics.prepare = function prepare(key, fleet, callback) {
  var m = new this({
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
  
  this.findOne({characterId: fleet.characterId, characterName: fleet.characterName}, function(err, member) {
    if (member) { m.key = member.key; }
    
    return callback(m);
  });
    
};

module.exports = mongoose.model('Member', MemberSchema);
