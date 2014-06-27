module.exports = function (fs) {

	var getSetting = function (setting) {
		if (process.env[setting]) {
			return process.env[setting];

		} else {
			throw "Setting " + setting + " not found. "
		}
	};

	return {
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
		mongoDbURI: getSetting('MONGODB_URI'),
		cookieSecret: getSetting('COOKIE_SECRET'),
		storage: getSetting('STORAGE_MODE'),
		log: 'console',

		memberTtl: 30000,
		armadaTtl: 28800000,
		eventTtl: 3600000,
		scanTtl: 3600000,

		// minPollInterval: 6000,
		minPollInterval: 1,
		cleanInterval: 60000,

		requestSizeLimit: '80kb',

		armadaPasswordMinLength: 3,
		armadaPasswordMaxLength: 32,

		scanMaxShips: 100,
		scanMinShips: 1,
	};
};
