var mongoose = require('mongoose-q')()
, Schema = mongoose.Schema
, settings = require(__dirname + '/../config/settings')
, moment = require('moment')

var types = ['Wormhole Detected', 
             'Hostile Cloaked',
             'Hostile Faded',
             'Hostile Logged Off',
             'Undock Camped',
             'Gate Bubbled'
            ];
            
var AdvisorySchema  = new Schema({
  ts: { type: Number, default: function() { return moment().unix(); } },
  fleetKey: Number,
  systemId: Number,
  hostileId: Number,
  type: {type: String, enum: types},
  ttl: Date
});

AdvisorySchema.index({ ts: 1 }, { expireAfterSeconds: settings.advisoryTtl });

module.exports = mongoose.model('Advisory', AdvisorySchema);
