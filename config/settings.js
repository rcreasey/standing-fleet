module.exports = function () {

	var getSetting = function (setting) {
		if (process.env[setting]) {
			return process.env[setting];
		} else {
			console.log("ERROR: setting '" + setting + "' not set.  Please check your ENV variables.");
			process.exit();
		}
	};

	var settings = {
		db: getSetting('MONGODB_URL'),
		domain: 'https://standing-fleet.herokuapp.com/',

		cookieSession: {
			key: 'standing-fleet',
			secret: getSetting('SESSION_SECRET'),
			cookie: {
				path: '/',
				httpOnly: true,
				maxAge: 43200000
			}
		},

		port: getSetting('PORT'),
		cookieSecret: getSetting('COOKIE_SECRET'),
		sessionSecret: getSetting('SESSION_SECRET'),
		log: 'console',

		hostileTtl: 900000,
		memberTtl: 60000,
		fleetTtl: 43200000,
		eventTtl: 900000,
		scanTtl: 900000,

		enableCache: false,

		// minPollInterval: 5000,
		minPollInterval: 500,
		cleanInterval: 60000,

		requestSizeLimit: '80kb',

		fleetPasswordMinLength: 3,
		fleetPasswordMaxLength: 32,

		scanMaxShips: 100,
		scanMinShips: 1,

		whitelist: { url: 'https://standings.goonfleet.com', threshold: 0.1, alliances: ['1354830081'], corporations: [] }
	};

	settings.root  = require('path').normalize(__dirname + '/..');
	settings.ships = require('../public/data/ships.json')

	return settings;
};
