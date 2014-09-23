var mongoose = require('mongoose')
  , Schema       = mongoose.Schema;

var FleetSchema  = new Schema({
  ts: { type: Number, default: function() { return new Date().getTime(); } },
  key: { type: String, index: true },
  name: String,
  password: String
});

module.exports = mongoose.model('Fleet', FleetSchema);
