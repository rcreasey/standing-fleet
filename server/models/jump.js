var mongoose = require('mongoose-q')()
  , Schema = mongoose.Schema

var JumpSchema = new Schema({
  to: { type: Number },
  from: { type: Number },
  type: String
});

JumpSchema.index({ to: 1, from: 1 });

module.exports = mongoose.model('Jump', JumpSchema);
