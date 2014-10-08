// require('newrelic');

var express = require('express')
  , debug = require('debug')('server')
  , path = require('path')
  , favicon = require('serve-favicon')
  , logger = require('morgan')
  , moment = require('moment')
  , compression = require('compression')
  , cookieParser = require('cookie-parser')
  , bodyParser = require('body-parser')

var routes = require(__dirname + '/lib/routes/index')
  , fleet  = require(__dirname + '/lib/routes/fleet');

var mongoose   = require('mongoose');
mongoose.connect(process.env.MONGODB_URL);

var app = express();

app.use(compression())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.enable('trust proxy');

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(cookieParser());

app.set('views', path.join(__dirname,'lib','views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));

app.use(require('express-session')({
  key: 'session',
  maxAge: moment().add(1, 'day')._d, expires: moment().add(1, 'day')._d,
  cookie: { path: '/', httpOnly: true, maxAge: moment().add(1, 'day')._d, expires: moment().add(1, 'day')._d},
  resave: true,
  secret: process.env.SESSION_SECRET,
  saveUninitialized: true,
  store: require('mongoose-session')(mongoose)
}));

app.use('/', routes);
app.use('/api', fleet);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
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

app.set('port', process.env.PORT || 5000);
var server = app.listen(app.get('port'), function() {
  console.log('Server listening on port ' + server.address().port);
});
