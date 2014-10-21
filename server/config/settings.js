module.exports = function () {
	var settings = {
		db: process.env.MONGODB_URL,
		domain: 'https://standing-fleet.herokuapp.com/',

		port: process.env.PORT || 5000,
		cookie_secret: process.env.COOKIE_SECRET || 'dongues',
		session_secret: process.env.SESSION_SECRET || 'buttes',
		log: 'console',

		hostileTtl: 300,
		memberTtl: 600,
		fleetTtl: 86400,

		minPollInterval: 0,
		cleanInterval: 300000,

		requestSizeLimit: '80kb',

		fleetPasswordMinLength: 3,
		fleetPasswordMaxLength: 32,

		scanMaxShips: 100,
		scanMinShips: 1,

		whitelist: { url: 'https://standings.goonfleet.com', threshold: 0.1, alliances: ['1354830081'], corporations: [] }
	};

	settings.root = require('path').normalize(__dirname + '/..');
	settings.ships = require(__dirname + '/../../public/data/ships.json')
	settings.map = require(__dirname + '/../../public/data/map.json')

	return settings;
}();
