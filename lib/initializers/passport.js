var passport = require('passport')
  , CrowdStrategy = require(__dirname + '/../crowd').Strategy
  , _ = require('lodash');

module.exports = function () {

  var pub = {};

  pub.init = function () {

    var users = [];

    passport.serializeUser(function (user, done) {
      done(null, user.username);
    });

    passport.deserializeUser(function (username, done) {
      var user = _.find(users, function (user) {
        return user.username == username;
      });
      if (user === undefined) {
        done(null, {username: username});
      } else {
        done(null, user);
      }
    });

    passport.use(new CrowdStrategy({
      crowdServer: process.env.CROWD_URL || "https://crowd.goonfleet.com/crowd/",
      crowdApplication: process.env.CROWD_USERNAME,
      crowdApplicationPassword: process.env.CROWD_PASSWORD,
      retrieveGroupMemberships: false
    },
    function (userprofile, done) {
      process.nextTick(function () {
        var exists = _.any(users, function (user) {
          return user.id == userprofile.id;
        });

        if (!exists) {
          users.push(userprofile);
        }

        return done(null, userprofile);
      });
    }));
  };

  return pub;
}();
