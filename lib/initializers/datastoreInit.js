var mongooseTypes = require("mongoose-types");

module.exports = function (mongoose) {
  var pub = {};

  pub.start = function (port) {
    mongoose.set('debug', true);
    mongoose.connect(process.env.MONGODB_URI);
    mongooseTypes.loadTypes(mongoose);
  };

  return pub;
};
