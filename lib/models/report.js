var mongoose = require('mongoose-q')()
  , Schema = mongoose.Schema
  , neow = require('neow')
  , _ = require('lodash')
  , chunk = require('chunk')
  , Q = require('q')
  , moment = require('moment')
  , settings = require(__dirname + '/../../config/settings')

var Hostile = require('./hostile')

var ReportSchema  = new Schema({
  ts: { type: Number, default: function() { return moment().unix(); } },
  fleetKey: { type: String, index: true },
  reporterId: Number,
  reporterName: String,
  systemId: Number,
  systemName: String,
  text: { type: String, default: 'validate' },
  data: [ Schema.Types.Mixed ],
  hostiles: [ Schema.Types.Mixed ],
});

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

var is_whitelisted = function(character) {
  if (_.contains(settings.whitelist.alliances, character.allianceID)) return true;
  if (_.contains(settings.whitelist.corporations, character.allianceID)) return true;

  if (_.contains(settings.whitelist.alliances, character.corporationID)) return true;
  if (_.contains(settings.whitelist.corporations, character.corporationID)) return true;
};

ReportSchema.methods.parse_standings = function parse_standings() {
  var response = Q.defer();

  if (this.hostiles.length > 0) return response.reject('Report hostiles already exist');
  var hostiles = [];
  var client = new neow.EveClient();

  _.forEach(chunk(this.data, 100), function(pilots) {
    client.fetch('eve:CharacterId', {names: pilots.join(',')})
      .then(function(results) {
        return client.fetch('eve:CharacterAffiliation', {ids: _.map(results.characters, function(c) { return c.characterID; }).join(",")});
      })
      .then(function(results) {

        _.forEach(results.characters, function(character) {
          if (is_whitelisted(character)) return;
          if (character.characterID == 0) return;
          if (character.characterName == '') return;

          hostiles.push( Hostile.prepare(this.fleetKey, this.reporterId, this.reporterName, character) );
        });

        response.resolve(hostiles);
      })
      .catch(function(error) {
        console.log(error)
        response.reject('CCP API data corrupt')
      })
      .done();
  });

  return response.promise;
};

var Report = mongoose.model('Report', ReportSchema);

module.exports = Report;
