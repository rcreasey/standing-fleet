var mongoose = require('mongoose-q')()
  , Schema = mongoose.Schema

var RegionSchema  = new Schema({
  id: { type: Number },
  name: { type: String },
  bounds: {
    left: Number,
    top: Number,
    bottom: Number,
    right: Number
  }
});

RegionSchema.index({ id: 1, name: 1 });

module.exports = mongoose.model('Region', RegionSchema);
