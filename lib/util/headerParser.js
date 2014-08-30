module.exports = function() {

	var pub = {};

	pub.parse = function(req) {
		return {
			trusted: req.get('EVE_TRUSTED'),
			id: req.get('EVE_CHARID'),
			name: req.get('EVE_CHARNAME'),

			shipType: req.get('EVE_SHIPTYPENAME'),
			shipTypeId: req.get('EVE_SHIPTYPEID'),
			shipName: req.get('EVE_SHIPNAME'),

			systemName: req.get('EVE_SOLARSYSTEMNAME'),
			systemId: req.get('EVE_SOLARSYSTEMID'),

			isDocked: !!req.get('EVE_STATIONID'),
		};
	};

	return pub;
};
