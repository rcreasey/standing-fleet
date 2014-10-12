var mongoose = require('mongoose-q')()
  , Schema = mongoose.Schema
  , key_generator = require(__dirname + '/../util/key-generator')

var FleetSchema  = new Schema({
  ts: { type: Number, default: function() { return new Date().getTime(); } },
  key: { type: String, index: true, default: function() { return key_generator.getKey(); } },
  name: String,
  password: Schema.Types.Mixed
});

FleetSchema.statics.prepare = function prepare(password) {
  return new this({ password: password });
};

module.exports = mongoose.model('Fleet', FleetSchema);
