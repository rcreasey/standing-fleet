module.exports = function (settings) {
  var pub = {};

  pub.start = function() {
    var mongoose = require('mongoose');
    mongoose.connect(process.env.MONGODB_URL);
    mongoose.set('debug', true);
  };

  return pub;
};
