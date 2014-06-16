module.exports = function() {

	var pub = {};

	pub.parse = function(req) {
		if (process.env["DEV"] == 'True') {
			return {
				trusted: process.env["DEV_TRUSTED"],
				id: process.env["DEV_CHARID"],
				name: process.env["DEV_CHARNAME"],

				shipType: process.env["DEV_SHIPTYPE"],
				shipTypeId: process.env["DEV_SHIPTYPEID"],
				shipName: process.env["DEV_SHIPNAME"],

				systemName: process.env["DEV_SYSTEMNAME"],
				systemId: process.env["DEV_SYSTEMID"],
				isDocked: !!req.get('EVE_STATIONID'),
			};
		} else {
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
		}
	};
	
	return pub;
};
