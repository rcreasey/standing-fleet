var mongoose = require('mongoose-q')()

module.exports = function () {
  var pub = {};

  pub.init = function() {
    mongoose.connect(process.env.MONGODB_URL);
    if (process.env.NODE_ENV === 'development') mongoose.set('debug', true);
    var cacheOpts = {
        maxAge: 5000,
        debug: process.env.NODE_ENV === 'development'
    };
    // require('mongoose-cache').install(mongoose, cacheOpts)
  };

  return pub;
}();
