var mongoose = require('mongoose-q')()
  , Schema = mongoose.Schema
  , settings = require(__dirname + '/../config/settings')
  , key_generator = require(__dirname + '/../util/key-generator')
  , moment = require('moment')

var EventSchema  = new Schema({
  ts: { type: Number, default: function() { return moment().unix(); } },
  key: { type: String, default: function() { return key_generator.getKey(); } },
  fleetKey: { type: String },
  type: String,
  data: Schema.Types.Mixed
});

EventSchema.index({ ts: 1, key: 1, fleetKey: 1 }, { expireAfterSeconds: settings.eventTtl });

EventSchema.statics.prepare = function prepare(type, fleetKey, data) {
  return new this({
    fleetKey: fleetKey,
    type: type,
    data: data
  });
};

module.exports = mongoose.model('Event', EventSchema);
