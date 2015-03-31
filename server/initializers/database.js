var mongoose = require('mongoose-q')()
  , cache = require('mongoose-memcached')
  , url = require('url')

module.exports = function () {
  var pub = {};

  pub.init = function() {
    mongoose.connect(process.env.MONGODB_URL);
    if (process.env.NODE_ENV === 'development') mongoose.set('debug', true);
    cache(mongoose, 
      {memServer: process.env.MEMCACHE_SERVERS, cache: false, 
       memOptions: {reconnect: 1000, timeout: 1000, retries: 2, failures: 2}
    });
  };

  return pub;
}();
