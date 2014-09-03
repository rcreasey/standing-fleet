module.exports = function (express, expressRoutes, expressMiddlewares, CrowdStrategy, consuelaService, standingsService, settings, passport, flash, logger, _) {

	var pub = {};


	pub.start = function (port) {

		var users = [{username: 'tarei'}];

		passport.serializeUser(function (user, done) {
	    done(null, user.username);
		});

		passport.deserializeUser(function (username, done) {
	    var user = _.find(users, function (user) {
			  return user.username == username;
			});
			if (user === undefined) {
			  done(new Error("No user with username '" + username + "' found."));
			} else {
			  done(null, user);
	    }
		});

		passport.use(new CrowdStrategy({
      crowdServer: process.env.CROWD_URL,
      crowdApplication: process.env.CROWD_USERNAME,
      crowdApplicationPassword: process.env.CROWD_PASSWORD,
      retrieveGroupMemberships: false
    },
    function (userprofile, done) {
      // asynchronous verification, for effect...
      process.nextTick(function () {
				var exists = _.any(users, function (user) {
				  return user.id == userprofile.id;
				});

				if (!exists) {
				  users.push(userprofile);
				}

				return done(null, userprofile);
			});
    }));

		var expressApp = express();
		expressApp.use(express.compress());
		expressApp.use(express.json());
		expressApp.use(express.urlencoded());
		expressApp.use(flash());

		expressApp.enable('trust proxy');

		expressApp.use(expressMiddlewares.sslHeaders);
		expressApp.use(expressMiddlewares.staticRewrite);

		expressApp.use(express.cookieParser(settings.cookieSecret));
		expressApp.use(express.cookieSession(settings.cookieSession));

		expressApp.use(passport.initialize());
		expressApp.use(passport.session());

		for (var route in expressRoutes.getRoutes) {
			expressApp.get(route, expressRoutes.getRoutes[route]);
		}

		for (var route in expressRoutes.postRoutes) {
			expressApp.post(route, expressRoutes.postRoutes[route]);
		}

		var root = require('path').normalize(__dirname + '/../..');

		expressApp.use(express.static(root + '/public', { maxAge: 999999999 }));
		expressApp.use(expressMiddlewares.sslCheck);

		expressApp.set('views', root + '/lib/views');
		expressApp.set('view engine', 'jade');
	  expressApp.engine('jade', require('jade').__express);

		expressApp.listen(port);
		consuelaService.startCleaning();
		standingsService.updateStandings();

		logger.log('Standing Fleet server listening on port ' + port + '...');
	};

	return pub;
};
