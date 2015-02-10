module.exports = function(req, res, next) {
  return {
    trusted: req.get('EVE_TRUSTED'),
    characterId: parseInt(req.get('EVE_CHARID')),
    characterName: req.get('EVE_CHARNAME'),

    shipType: req.get('EVE_SHIPTYPENAME'),
    shipTypeId: parseInt(req.get('EVE_SHIPTYPEID')),
    shipName: req.get('EVE_SHIPNAME'),

    regionName: req.get('EVE_REGIONNAME'),
    systemName: req.get('EVE_SOLARSYSTEMNAME'),
    systemId: parseInt(req.get('EVE_SOLARSYSTEMID')),

    isDocked: !!req.get('EVE_STATIONID'),
  };
};
