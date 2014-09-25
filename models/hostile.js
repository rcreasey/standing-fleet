var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var HostileSchema  = new Schema({
  ts: { type: Number, default: function() { return new Date().getTime(); } },
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

module.exports = mongoose.model('Hostile', HostileSchema);
