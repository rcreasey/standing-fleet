module.exports = function (express, expressRoutes, expressMiddlewares, consuelaService, settings, logger) {

	var pub = {};

	pub.start = function (port) {
		var expressApp = express();
		expressApp.use(express.compress());
		expressApp.use(express.json());
		expressApp.use(express.urlencoded());
		//expressApp.use(expressMiddlewares.validateRequestSize); // Breaks POST scan submissions
		expressApp.use(express.cookieParser(settings.cookieSecret));
		expressApp.use(express.cookieSession(settings.cookieSession));

		for (var route in expressRoutes.getRoutes) {
			expressApp.get(route, expressRoutes.getRoutes[route]);
		}

		for (var route in expressRoutes.postRoutes) {
			expressApp.post(route, expressRoutes.postRoutes[route]);
		}

		expressApp.use(expressMiddlewares.staticRewrite);
		expressApp.use(express.static(__dirname + '/../../public', { maxAge: 999999999 }));

		expressApp.listen(port);
		consuelaService.startCleaning();

		logger.log('Standing Fleet server listening on port ' + port + '...');
	};

	return pub;
};
