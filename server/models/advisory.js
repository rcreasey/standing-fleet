var mongoose = require('mongoose-q')()
, Schema = mongoose.Schema
, settings = require(__dirname + '/../config/settings')
, moment = require('moment')

var types = [
  'Wormhole Detected', 
  'Hostile Cloaked',
  'Hostile Docked',
  'Hostile Faded',
  'Hostile Logged Off',
  'Undock Camped',
  'Gate Bubbled'
];

exports.types = types;
            
var AdvisorySchema  = new Schema({
  ts: { type: Number, default: function() { return moment().unix(); } },
  fleetKey: String,
  systemId: Number,
  hostileId: Number,
  type: {type: String, enum: types}
});

AdvisorySchema.index({ ts: 1 }, { expireAfterSeconds: settings.advisoryTtl });

AdvisorySchema.statics.format = function prepare(fleetKey, systemId, type) {
  return {
    ts: moment().unix(),
    fleetKey: fleetKey,
    systemId: systemId,
    type: type
  };
};

module.exports = mongoose.model('Advisory', AdvisorySchema);
