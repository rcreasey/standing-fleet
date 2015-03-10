var mongoose = require('mongoose-q')()
  , Schema = mongoose.Schema
  , _ = require('lodash')

var ShipSchema  = new Schema({
  id: Number,
  name: String,
  class: String,
  meta: String
});

ShipSchema.index({ id: 1, name: 1 });

ShipSchema.statics.is_jumpcapable = function(ship_name) {
  return _.include([
    'Capsule',
    'Redeemer', 
    'Widow', 
    'Sin', 
    'Panther',
    'Rorqual',
    'Archon',
    'Chimera', 
    'Thanatos', 
    'Nidhoggur',
    'Revelation',
    'Phoenix', 
    'Moros', 
    'Naglfar',
    'Ark', 
    'Rhea', 
    'Anshar', 
    'Nomad',
    'Aeon', 
    'Wyvern', 
    'Nyx', 
    'Hel', 
    'Revenant',
    'Avatar', 
    'Leviathan', 
    'Erebus', 
    'Ragnarok'
  ], ship_name);
}

// Blops: [

module.exports = mongoose.model('Ship', ShipSchema);
