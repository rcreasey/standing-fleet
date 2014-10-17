var mongoose = require('mongoose-q')();

module.exports = function () {
  var pub = {};

  pub.init = function() {
    mongoose.connect(process.env.MONGODB_URL);
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', true);
    }
  };

  return pub;
}();
