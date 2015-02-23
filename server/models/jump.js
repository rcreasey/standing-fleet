var mongoose = require('mongoose-q')()
  , Schema = mongoose.Schema
  , moment = require('moment')

var lifespanEstimates = [
  'Unknown',
  'Not yet begun (>24h)',
  'Beginning to decay (4-24h)',
  'End of its lifetime (<4h)',
  'Verge of dissipating (<15m)',
  'Collapsing (<1m)'
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
  updated_at: Number,
  wormhole_data: {
    signature: String,
    mass_estimate: {type: String, enum: massEstimates},
    lifespan_estimate: {type: String, enum: lifespanEstimates},
    discovered_on: Number,
    expires_on: Number
  }
});

JumpSchema.index({ toSystem: 1, fromSystem: 1 });

JumpSchema.methods.type = function() {
  if (this.wormhole_data.expires_on !== undefined) return 'wormhole';
  else if (this.toRegion != this.fromRegion) return 'region';
  else if (this.toConstellation != this.fromConstellation) return 'constellation';
  else return 'normal';
};

JumpSchema.statics.parseWormholeInfo = function(info_text) {
  var wormhole_data = {};
  
  if (/not yet begun/.test(info_text)) {
    wormhole_data.lifespan_estimate = lifespanEstimates[1];
    wormhole_data.expires_on = moment().add(24, 'hours').utc().unix();
  } else if (/beginning to decay/.test(info_text)) { 
    wormhole_data.lifespan_estimate = lifespanEstimates[2];
    wormhole_data.expires_on = moment().add(12, 'hours').utc().unix();
  } else if (/reaching the ende/.test(info_text)) {
    wormhole_data.lifespan_estimate = lifespanEstimates[3];
    wormhole_data.expires_on = moment().add(4, 'hours').utc().unix();
  } else if (/on the verge/.test(info_text)) {
    wormhole_data.lifespan_estimate = lifespanEstimates[4];
    wormhole_data.expires_on = moment().add(1, 'hour').utc().unix();
  } else if (/collapsed/.test(info_text)) {
    wormhole_data.lifespan_estimate = lifespanEstimates[5];
    wormhole_data.expires_on = moment().utc().unix();
  } else {
    wormhole_data.lifespan_estimate = lifespanEstimates[0];
  }
    
  if (/has not yet had its stability significantly disrupted/.test(info_text)) {
    wormhole_data.mass_estimate = massEstimates[1];
  } else if (/has had its stability reduced by ships passing through it/.test(info_text)) {
    wormhole_data.mass_estimate = massEstimates[2];
  } else if (/has had its stability critically disrupted/.test(info_text)) {
    wormhole_data.mass_estimate = massEstimates[3];
  } else {
    wormhole_data.mass_estimate = massEstimates[0];
  }
    
  return wormhole_data;
};

module.exports = mongoose.model('Jump', JumpSchema);
