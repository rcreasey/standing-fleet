var mongoose = require('mongoose-q')()
  , Schema = mongoose.Schema

var SystemSchema  = new Schema({
  id: { type: Number, index: true },
  constellationID: Number,
  regionID: { type: Number, index: true },
  name: String,
  x: Number,
  y: Number
});

module.exports = mongoose.model('System', SystemSchema);
