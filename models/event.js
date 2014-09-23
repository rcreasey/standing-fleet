var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var EventSchema  = new Schema({
  ts: { type: Number, default: function() { return new Date().getTime(); } },
  key: { type: String, index: true },
  fleetKey: String,
  type: String,
  data: Schema.Types.Mixed
});

module.exports = mongoose.model('Event', EventSchema);
