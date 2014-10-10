var mongoose = require('mongoose');

module.exports = function () {
  var pub = {};

  pub.init = function() {
    mongoose.connect(process.env.MONGODB_URL);
    mongoose.set('debug', true);
  };

  return pub;
}();
