module.exports = function (settings) {
  var pub = {};

  pub.start = function() {
    var mongoose = require('mongoose');
    mongoose.connect(settings.db);
    mongoose.set('debug', true);
  };

  return pub;
};
