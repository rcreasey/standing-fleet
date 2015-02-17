var mongoose = require('mongoose-q')()
  , Schema = mongoose.Schema
  , neow = require('neow')
  , _ = require('lodash')
  , chunk = require('chunk')
  , Q = require('q')
  , moment = require('moment')
  , settings = require(__dirname + '/../config/settings')
  , Hostile = require('./hostile');

var ReportSchema  = new Schema({
  ts: { type: Number, default: function() { return moment().unix(); } },
  fleetKey: { type: String },
  reporterId: Number,
  reporterName: String,
  systemId: Number,
  systemName: String,
  text: { type: String, default: 'validate' },
  data: [ Schema.Types.Mixed ],
  hostiles: [ Schema.Types.Mixed ],
});

ReportSchema.index({ ts: 1, fleetKey: 1 }, { expireAfterSeconds: settings.reportTtl });

ReportSchema.statics.prepare = function prepare(fleetKey, report) {
  return new this({
    fleetKey: fleetKey,
    reporterId: report.reporterId,
    reporterName: report.reporterName,
    systemId: report.systemId,
    systemName: report.systemName,
    text: report.text,
    data: report.data || [],
    hostiles: []
  });
};

var is_whitelisted = function(whitelist, character) {
  if (_.contains(whitelist.alliances, character.allianceID)) return true;
  if (_.contains(whitelist.corporations, character.allianceID)) return true;

  if (_.contains(whitelist.alliances, character.corporationID)) return true;
  if (_.contains(whitelist.corporations, character.corporationID)) return true;
};

ReportSchema.methods.parse_standings = function parse_standings(whitelist) {
  var fleetKey = this.fleetKey;
  var reporter = {characterId: this.reporterId, characterName: this.reporterName};
  var response = Q.defer();

  if (this.hostiles.length > 0) return response.reject('Report hostiles already exist');
  var hostiles = [];
  var client = new neow.EveClient();
  
  Q.all(_.map(chunk(this.data, 100), function(pilots) {
    var pilot_list = pilots.join(',');
    var batch = Q.defer();
    client.fetch('eve:CharacterId', {names: pilots.join(',')})
      .then(function(results) {
        return client.fetch('eve:CharacterAffiliation', {ids: _.map(results.characters, function(c) { return c.characterID; }).join(",")});
      })
      .then(function(results) {
        
        resolved = _.map(results.characters, function(character) {
          if (is_whitelisted(whitelist, character)) return false;
          if (character.characterID === 0) return false;
          if (character.characterName === '') return false;
          
          var hostile = Hostile.prepare(fleetKey, reporter, character);
          if (!hostile) throw 'Invalid hostile: ' + character;
          return hostile.toObject();
        });
        
        batch.resolve(_.where(resolved));
      })
      .catch(function(error) {
        batch.reject(error + ': ' + pilot_list);
      })
      .done();
      
      return batch.promise;
    })
  )
  .then(function(results) {
    response.resolve(_.flatten(results)); 
  })
  .catch(function(error) {
    console.error(error);
    response.reject('CCP API data corrupt: ' + error);
  })
  .done();

  return response.promise;
};

var Report = mongoose.model('Report', ReportSchema);

module.exports = Report;
exports.is_whitelisted = is_whitelisted;
