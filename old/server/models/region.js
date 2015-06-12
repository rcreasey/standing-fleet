var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  

var RegionSchema  = new Schema({
  id: Number,
  name: String
});

RegionSchema.index({ id: 1 });

module.exports = mongoose.model('Region', RegionSchema);
