var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var MemberSchema  = new Schema({
  ts: { type: Number, default: function() { return new Date().getTime(); } },
  key: { type: String, index: true },
  fleetKey: { type: String, index: true },
  characterId: Number,
  characterName: String,
  shipType: String,
  shipTypeId: Number,
  systemName: String,
  systemId: Number,
  is_docked: Boolean
});

module.exports = mongoose.model('Member', MemberSchema);
