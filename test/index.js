var config = require('./config');
var winston = require('winston');
var mongoose = require('mongoose');
var server = require('../server');

// mongoose.connect(config.db.mongodb);
server.start();
