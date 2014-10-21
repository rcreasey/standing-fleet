var mongoose = require('mongoose-q')()
  , Schema = mongoose.Schema

var RegionSchema  = new Schema({
  id: { type: Number, index: true },
  name: { type: String, index: true },
  bounds: {
    left: Number,
    top: Number,
    bottom: Number,
    right: Number
  }
});

module.exports = mongoose.model('Region', RegionSchema);
