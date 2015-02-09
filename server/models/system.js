var mongoose = require('mongoose-q')()
  , Schema = mongoose.Schema

var SystemSchema  = new Schema({
  id: { type: Number },
  constellationID: Number,
  regionID: { type: Number },
  name: String,
  x: Number,
  y: Number,
  security: Number,
  security_class: String
});

SystemSchema.index({ id: 1, regionID: 1 });

module.exports = mongoose.model('System', SystemSchema);
