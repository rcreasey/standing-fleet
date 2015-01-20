if (process.env.NODE_ENV === 'production') require('newrelic');

var express = require('express')
  , debug = require('debug')('server')
  , path = require('path')
  , favicon = require('serve-favicon')
  , logger = require('morgan')
  , mongoose = require('mongoose-q')()
  , compression = require('compression')
  , cookieParser = require('cookie-parser')
  , bodyParser = require('body-parser')
  , flash = require('connect-flash')
  , passport = require('passport')
  , session = require('express-session')

var settings = require(__dirname + '/config/settings')
  , checks = require(__dirname + '/middleware/checks')
  , standings = require(__dirname + '/services/standings')
  , consuela = require(__dirname + '/services/consuela')

var database = require(__dirname + '/initializers/database')
  , strategy = require(__dirname + '/initializers/passport')

var routes = require(__dirname + '/routes/index')
  , fleet  = require(__dirname + '/routes/fleet')
  , map    = require(__dirname + '/routes/map')
  , scans  = require(__dirname + '/routes/scans')
  , docs  = require(__dirname + '/routes/docs')

var app = express();

database.init();
strategy.init();

standings.update(settings.whitelist);
app.set('whitelist', settings.whitelist);
app.set('map', settings.map);

app.use(compression())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(checks.static_rewrite);

app.set('trust proxy', 1);

app.use(favicon(__dirname + '/../public/favicon.ico'));
if (app.get('env') !== 'test') app.use(logger('dev'));
app.use(cookieParser());

app.set('views', path.join(__dirname,'views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname,'..','public')));

app.use(session({
  name: settings.session_name,
  secret: settings.session_secret,
  resave: true,
  saveUninitialized: true,
  store: require('mongoose-session')(mongoose)
}))

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use('/docs', docs);
app.use('/', routes);
app.use('/api/fleets', fleet);
app.use('/api/scans', scans);
app.use('/api/map', map);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    console.log(err.stack);
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err.stack
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.set('port', settings.port);

function start() {
  var server = app.listen(app.get('port'), function() {
    console.log('Standing Fleet server listening on port ' + server.address().port + ' in ' + app.get('env') + ' mode.');
  });
}

if (process.env.CONSUELA !== 'disable') consuela.start_cleaning();
start();

exports.app = app;
exports.start = start;
