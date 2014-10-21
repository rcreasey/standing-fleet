var mongoose = require('mongoose-q')()
  , Schema = mongoose.Schema

var JumpSchema = new Schema({
  to: { type: Number, index: true },
  from: { type: Number, index: true },
  type: String
});

module.exports = mongoose.model('Jump', JumpSchema);
