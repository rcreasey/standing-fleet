var mongoose = require('mongoose-q')()
  , Schema = mongoose.Schema

var SystemSchema  = new Schema({
  id: Number ,
  constellationID: Number,
  regionID: Number,
  name: String,
  x: Number,
  y: Number,
  security: Number,
  security_class: String,
  wormhole_data: {
    effectId: Number,
    effectName: String,
    class: Number
  }
});

SystemSchema.index({ id: 1, regionID: 1 });

SystemSchema.methods.is_wspace = function() {
  return this.id >= 31000000 && this.id <= 31999999;
};

SystemSchema.statics.findWormholes = function (cb) {
  this.find({id: {$gte: 31000000, $lte: 31999999}}, cb);
};

module.exports = mongoose.model('System', SystemSchema);
