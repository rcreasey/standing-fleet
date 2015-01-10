module.exports = function () {
	var settings = {
		db: process.env.MONGODB_URL,
		domain: 'https://standing-fleet.apps.goonswarm.org/',

		port: process.env.PORT || 5000,
		session_name: 'standing-fleet',
		session_secret: process.env.SESSION_SECRET || 'buttes',
		log: 'console',

		advisoryTtl: 3600,
		eventTtl: 300,
		scanTtl: 86400,
		reportTtl: 86400,
		hostileFadeTtl: 600,
		hostileRemoveTtl: 1200,
		memberTtl: 600,
		
		fleets: [						
			{name: 'BRN.CFC',  description: 'Branch'},
			{name: 'CR.CFC',  description: 'Cloud Ring'},
			{name: 'DEK.CFC',  description: 'Deklein'},
			{name: 'FTN.CFC',  description: 'Fountain'},
			{name: 'GEM.CFC',  description: 'Geminate'},
			{name: 'PBF.CFC',  description: 'Fade and Pure Blind'},
			{name: 'SYND.CFC',  description: 'Syndicate'},
			{name: 'TNL.CFC',  description: 'Tenal'},
			{name: 'TRIB.CFC',  description: 'Tribute'},
			{name: 'VALE.CFC',  description: 'Vale of the Silent'},
			{name: 'VNL.CFC',  description: 'Venal'}
		],

		minPollInterval: 0,
		cleanInterval: 60000,

		requestSizeLimit: '80kb',

		fleetPasswordMinLength: 3,
		fleetPasswordMaxLength: 32,

		scanMaxShips: 100,
		scanMinShips: 1,

		whitelist: { url: 'https://standings.goonfleet.com', threshold: 0.1, alliances: ['1354830081'], corporations: [] }
	};

	settings.root = require('path').normalize(__dirname + '/..');
	settings.ships = require(__dirname + '/../../public/data/ships.json');
	settings.map = require(__dirname + '/../../public/data/map.json');

	return settings;
}();
