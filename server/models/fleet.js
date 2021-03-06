var mongoose = require('mongoose-q')()
  , Schema = mongoose.Schema
  , moment = require('moment')
  , key_generator = require(__dirname + '/../util/key-generator')

var FleetSchema  = new Schema({
  ts: { type: Number, default: function() { return moment().unix(); } },
  key: { type: String, default: function() { return key_generator.getKey(); } },
  name: String,
  description: String,
  password: Schema.Types.Mixed
});

FleetSchema.index({ ts: 1, key: 1 });

FleetSchema.statics.prepare = function prepare(fleet) {
  return new this({ name: fleet.name, description: fleet.description, password: false });
};

module.exports = mongoose.model('Fleet', FleetSchema);
