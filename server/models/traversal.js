var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , moment = require('moment')
  
var TraversalSchema = new Schema({
  fc_characterName: String,
  fc_characterId: Number,
  fleet_name: String,
  mass: String,
  ts: { type: Number, default: function() { return moment().unix(); } }
});

TraversalSchema.index({ id: 1 });

module.exports = mongoose.model('Traversal', TraversalSchema);
