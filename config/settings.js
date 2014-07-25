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
		cookieSession: {
			key: 'armadaSession',
			secret: getSetting('SESSION_SECRET'),
			cookie: {
				path: '/',
				httpOnly: true,
				maxAge: 864000000
			}
		},

		port: getSetting('PORT'),
		cookieSecret: getSetting('COOKIE_SECRET'),
		storage: getSetting('STORAGE_MODE'),
		log: 'console',

		memberTtl: 30000,
		armadaTtl: 28800000,
		eventTtl: 3600000,
		scanTtl: 3600000,

		minPollInterval: 1,
		cleanInterval: 60000,

		requestSizeLimit: '80kb',

		armadaPasswordMinLength: 3,
		armadaPasswordMaxLength: 32,

		scanMaxShips: 100,
		scanMinShips: 1,

		whitelist: { url: 'https://standings.goonfleet.com', threshold: 0.1, alliances: ['1354830081'], corporations: [] }
	};

	if (settings.storage == 'mongoDb') settings.mongoDbURI = getSetting('MONGODB_URI');

	return settings;
};
