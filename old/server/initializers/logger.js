var winston = require('winston')
  , expressWinston = require('express-winston');

require('winston-papertrail').Papertrail;

expressWinston.requestWhitelist.push('session');
expressWinston.requestWhitelist.push('body');
expressWinston.bodyBlacklist.push('password');

module.exports = function () {
  var pub = {};

  pub.init = function(app) {
    
    var logger_transports = [
        new winston.transports.Console({
          json: false,
          colorize: true
        })
      ];
      
    if (process.env.PAPERTRAIL_HOST && process.env.PAPERTRAIL_PORT) {
      logger_transports.push(
        new winston.transports.Papertrail({
          hostname: process.env.NODE_ENV,
          host: process.env.PAPERTRAIL_HOST,
          port: process.env.PAPERTRAIL_PORT,
          program: 'middleware',
          // colorize: true,
          inlineMeta: true,
          handleExceptions: true
        })
      );
    }
     
    app.use( expressWinston.logger({transports: logger_transports,
      meta: true, 
      msg: "HTTP {{req.method}} {{req.url}}",
      expressFormat: true, 
      colorStatus: true
    }));
  };
  
  return pub;
}();
