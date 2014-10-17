var mongoose = require('mongoose-q')()
  , Schema = mongoose.Schema
  , moment = require('moment')

var ScanSchema  = new Schema({
  ts: { type: Number, default: function() { return moment().unix(); } },
  key: { type: String, index: true },
  fleetKey: { type: String, index: true },

  reporterId: Number,
  reporterName: String,

  systemId: Number,
  systemName: String,

  shipTypes: Schema.Types.Mixed,
  shipClasses: Schema.Types.Mixed
});

module.exports = mongoose.model('Scan', ScanSchema);
