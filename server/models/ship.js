var mongoose = require('mongoose-q')()
  , Schema = mongoose.Schema

var ShipSchema  = new Schema({
  id: Number,
  name: String,
  class: String,
  meta: String
});

ShipSchema.index({ id: 1, name: 1 });

module.exports = mongoose.model('Ship', ShipSchema);
