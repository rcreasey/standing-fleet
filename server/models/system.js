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

SystemSchema.methods.is_wspace = function() {
  return this.id >= 31000000 && this.id <= 31999999;
};

SystemSchema.statics.findWormholes = function (cb) {
  this.find({id: {$gte: 31000000, $lte: 31999999}}, cb);
};

module.exports = mongoose.model('System', SystemSchema);
