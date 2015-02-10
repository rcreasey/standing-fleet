var mongoose = require('mongoose-q')()
  , Schema = mongoose.Schema

var lifespanEstimates = [
  'Unknown', 
  'Not yet begun (>24h)',
  'Beginning to decay (4-24h)',
  'End of its lifetime (<4h)',
  'Verge of dissipating (<15m)',
  'Expired'
];

exports.lifespanEstimates = lifespanEstimates;

var massEstimates = [
  'Unknown', 
  'Not disrupted (>50%)',
  'Beginning to decay (4-24h)',
  'Under half remaining (<50%)',
  'Critical (<10%)'
];

exports.massEstimates = massEstimates;
  
var JumpSchema = new Schema({
  toSystem: Number,
  fromSystem: Number,
  toRegion: Number,
  fromRegion: Number,
  toConstellation: Number,
  fromConstellation: Number,
  wormhole_data: {
    mass_estimate: {type: String, enum: massEstimates},    
    lifespan_estimate: {type: String, enum: lifespanEstimates},    
    discovered_on: Number,
    updated_at: Number,
    expires_on: Number
  }
});

JumpSchema.index({ toSystem: 1, fromSystem: 1 });

JumpSchema.methods.type = function() {
  if (this.toRegion != this.fromRegion) return 'region';
  else if (this.toConstellation != this.fromConstellation) return 'constellation';
  else return 'normal';
};

module.exports = mongoose.model('Jump', JumpSchema);
