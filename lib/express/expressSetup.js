module.exports = function (express, expressRoutes, expressMiddlewares, consuelaService, standingsService, settings, logger) {

	var pub = {};

	pub.start = function (port) {
		var expressApp = express();
		expressApp.use(express.compress());
		expressApp.use(express.json());
		expressApp.use(express.urlencoded());

		expressApp.enable('trust proxy');

		expressApp.use(expressMiddlewares.sslHeaders);
		expressApp.use(expressMiddlewares.staticRewrite);

		expressApp.use(express.cookieParser(settings.cookieSecret));
		expressApp.use(express.cookieSession(settings.cookieSession));

		for (var route in expressRoutes.getRoutes) {
			expressApp.get(route, expressRoutes.getRoutes[route]);
		}

		for (var route in expressRoutes.postRoutes) {
			expressApp.post(route, expressRoutes.postRoutes[route]);
		}

		expressApp.use(express.static(__dirname + '/../../public', { maxAge: 999999999 }));
		expressApp.use(expressMiddlewares.sslCheck);

		expressApp.listen(port);
		consuelaService.startCleaning();
		standingsService.updateStandings();

		logger.log('Standing Fleet server listening on port ' + port + '...');
	};

	return pub;
};
