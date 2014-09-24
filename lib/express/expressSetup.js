module.exports = function (express, expressRoutes, expressMiddlewares, passportInit, databaseInit, consuelaService, standingsService, session, settings, moment, passport, flash, logger, _) {

	var pub = {};

	pub.start = function (port) {
		passportInit.start();
		databaseInit.start();

		var expressApp = express();
		expressApp.use(express.compress());
		expressApp.use(express.json());
		expressApp.use(express.urlencoded());
		expressApp.use(flash());

		expressApp.enable('trust proxy');

		expressApp.use(expressMiddlewares.sslHeaders);
		expressApp.use(expressMiddlewares.staticRewrite);

		expressApp.use(express.cookieParser(settings.cookieSecret));

		expressApp.use(express.session({
			maxAge: moment().add(1, 'week')._d,
			expires: moment().add(1, 'week')._d,
      cookie: { path: '/', httpOnly: true, maxAge: moment().add(1, 'week')._d, _expires: moment().add(1, 'week')._d},
		  secret: settings.cookieSecret,
		  store: new session(express)({ url: settings.db })
		}));

		expressApp.use(passport.initialize());
		expressApp.use(passport.session());

		expressApp.use(express.static(settings.root + '/public', { maxAge: 999999999 }));

		for (var route in expressRoutes.getRoutes) {
			expressApp.get(route, expressRoutes.getRoutes[route]);
		}

		for (var route in expressRoutes.postRoutes) {
			expressApp.post(route, expressRoutes.postRoutes[route]);
		}

		expressApp.use(expressMiddlewares.sslCheck);

		expressApp.set('views', settings.root + '/lib/views');
		expressApp.set('view engine', 'jade');
	  expressApp.engine('jade', require('jade').__express);

		expressApp.listen(port);
		// consuelaService.startCleaning();
		standingsService.updateStandings();

		logger.log('Standing Fleet server listening on port ' + port + '...');
	};

	return pub;
};
