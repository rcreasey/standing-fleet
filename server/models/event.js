var mongoose = require('mongoose-q')()
  , Schema = mongoose.Schema
  , key_generator = require(__dirname + '/../util/key-generator')
  , moment = require('moment')

var EventSchema  = new Schema({
  ts: { type: Number, index: true, default: function() { return moment().unix(); }, expires: '15m' },
  key: { type: String, index: true, default: function() { return key_generator.getKey(); } },
  fleetKey: { type: String, index: true },
  type: String,
  data: Schema.Types.Mixed
});

EventSchema.statics.prepare = function prepare(type, fleetKey, data) {
  return new this({
    fleetKey: fleetKey,
    type: type,
    data: data
  });
};

module.exports = mongoose.model('Event', EventSchema);
