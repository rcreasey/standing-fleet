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
    code: String,
    mass_estimate: {type: String, enum: massEstimates},
    mass_total: String,
    jump_mass: String,
    lifespan_estimate: {type: String, enum: lifespanEstimates},
    discovered_on: Number,
    expires_on: Number
  }
});

JumpSchema.index({ toSystem: 1, fromSystem: 1 });

JumpSchema.methods.type = function() {
  if (this.toObject().wormhole_data !== undefined) return 'wormhole';
  else if (this.toObject().toRegion != this.toObject().fromRegion) return 'region';
  else if (this.toObject().toConstellation != this.toObject().fromConstellation) return 'constellation';
  else return 'normal';
};

JumpSchema.statics.parseWormholeInfo = function(body) {
  var _ = require('lodash')
    , static_data = require(__dirname + '/../../public/data/wormhole_types.json')
    
  var info = {};
  
  if (/^[A-Za-z]{3}-\d{3}$/.test(body.signature_id)) info['wormhole_data.signature'] = body.signature_id.toUpperCase();
  if (_.include(_.map(static_data.wormhole_types, 'code'), body.code)) info['wormhole_data.code'] = body.code;
  var type = _.find(static_data.wormhole_types, function(t) { return t.code == info['wormhole_data.code']; });
  
  if (type) {
    info['wormhole_data.jump_mass'] = parseInt(type.jump_mass);
    info['wormhole_data.mass_total'] = parseInt(type.lifetime_mass);
  } else {
    info['wormhole_data.jump_mass'] = _.min(static_data.wormhole_types, function(t) { return parseInt(t.jump_mass); });
    info['wormhole_data.mass_total'] = _.min(static_data.wormhole_types, function(t) { return parseInt(t.lifetime_mass); });
  }
  
  if (/not yet begun/.test(body.info)) {
    info['wormhole_data.lifespan_estimate'] = lifespanEstimates[1];
    info['wormhole_data.expires_on'] = moment().add(24, 'hours').utc().unix();
  } else if (/beginning to decay/.test(body.info)) { 
    info['wormhole_data.lifespan_estimate'] = lifespanEstimates[2];
    info['wormhole_data.expires_on'] = moment().add(12, 'hours').utc().unix();
  } else if (/reaching the ende/.test(body.info)) {
    info['wormhole_data.lifespan_estimate'] = lifespanEstimates[3];
    info['wormhole_data.expires_on'] = moment().add(4, 'hours').utc().unix();
  } else if (/on the verge/.test(body.info)) {
    info['wormhole_data.lifespan_estimate'] = lifespanEstimates[4];
    info['wormhole_data.expires_on'] = moment().add(1, 'hour').utc().unix();
  } else if (/collapsed/.test(body.info)) {
    info['wormhole_data.lifespan_estimate'] = lifespanEstimates[5];
    info['wormhole_data.expires_on'] = moment().utc().unix();
  }
    
  if (/has not yet had its stability significantly disrupted/.test(body.info)) {
    info['wormhole_data.mass_estimate'] = massEstimates[1];
  } else if (/has had its stability reduced by ships passing through it/.test(body.info)) {
    info['wormhole_data.mass_estimate'] = massEstimates[2];
    info['wormhole_data.mass_total'] = info['wormhole_data.mass_total'] * 0.5; 
  } else if (/has had its stability critically disrupted/.test(body.info)) {
    info['wormhole_data.mass_estimate'] = massEstimates[3];
    info['wormhole_data.mass_total'] = info['wormhole_data.mass_total'] * 0.1;
  }
  
  info.updated_at = moment().utc().unix();

  return info;
};

module.exports = mongoose.model('Jump', JumpSchema);
