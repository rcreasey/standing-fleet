require('newrelic');

var express = require('express')
  , debug = require('debug')('server')
  , path = require('path')
  , favicon = require('serve-favicon')
  , logger = require('morgan')
  , moment = require('moment')
  , mongoose = require('mongoose-q')()
  , compression = require('compression')
  , cookieParser = require('cookie-parser')
  , bodyParser = require('body-parser')
  , flash = require('connect-flash')
  , passport = require('passport')

var settings = require(__dirname + '/config/settings')
  , checks = require(__dirname + '/middleware/checks')
  , standings = require(__dirname + '/services/standings')
  , consuela = require(__dirname + '/services/consuela')

var database = require(__dirname + '/initializers/database')
  , strategy = require(__dirname + '/initializers/passport')

var routes = require(__dirname + '/routes/index')
  , fleet  = require(__dirname + '/routes/fleet')

var app = express();

database.init();
strategy.init();

standings.update(settings.whitelist);
app.set('whitelist', settings.whitelist);

app.use(compression())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(checks.ssl_headers);
app.use(checks.redirect_to_https);
app.use(checks.static_rewrite);

app.enable('trust proxy');

app.use(favicon(__dirname + '/../public/favicon.ico'));
if (app.get('env') !== 'test') app.use(logger('dev'));
app.use(cookieParser());

app.set('views', path.join(__dirname,'views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname,'..','public')));

app.use(require('express-session')({
  key: 'session',
  maxAge: moment().add(1, 'day')._d, expires: moment().add(1, 'day')._d,
  cookie: { path: '/', httpOnly: true, maxAge: moment().add(1, 'day')._d, expires: moment().add(1, 'day')._d},
  resave: true,
  secret: settings.session_secret,
  saveUninitialized: true,
  store: require('mongoose-session')(mongoose)
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);
app.use('/api', fleet);

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

consuela.start_cleaning();
start();

exports.app = app;
exports.start = start;
