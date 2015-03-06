var passport = require('passport')
  , CrowdStrategy = require(__dirname + '/../crowd').Strategy
  , LocalStrategy = require('passport-local').Strategy
  , _ = require('lodash');

module.exports = function () {

  var pub = {};

  pub.init = function () {

    var users = [{ provider: 'atlassian-crowd',
      id: 'tarei',
      username: 'tarei',
      displayName: 'tarei',
      name: { familyName: '', givenName: 'Tarei' },
      email: 'ryan@kaneda.net',
      emails: [ { value: 'ryan@kaneda.net' } ],
      _json:
       { expand: 'attributes',
         link:
          { href: 'http://localhost:8095/crowd/rest/usermanagement/latest/user?username=tarei',
            rel: 'self' },
         name: 'tarei',
         password: { link: [Object] },
         key: '524289:tarei',
         active: true,
         attributes: { attributes: [], link: [Object] },
         'first-name': 'Tarei',
         'last-name': '',
         'display-name': 'tarei',
         email: 'ryan@kaneda.net' },
      _raw: '{"expand":"attributes","link":{"href":"http://localhost:8095/crowd/rest/usermanagement/latest/user?username=tarei","rel":"self"},"name":"tarei","password":{"link":{"href":"http://localhost:8095/crowd/rest/usermanagement/latest/user/password?username=tarei","rel":"edit"}},"key":"524289:tarei","active":true,"attributes":{"attributes":[],"link":{"href":"http://localhost:8095/crowd/rest/usermanagement/latest/user/attribute?username=tarei","rel":"self"}},"first-name":"Tarei","last-name":"","display-name":"tarei","email":"ryan@kaneda.net"}',
      groups:
       [ '[GS] Goonfleet',
         '[IT] DevOps',
         '[S] Space Violence',
         '[S] Theta',
         '[SIG] CrapSwarm',
         '[SIG] GARPA',
         '[SIG] GSF Alt Corps',
         '[SIG] Hole Squad',
         '[SIG] Incursions',
         '[SIG] Little Bees',
         '[SIG] Skirmish Commanders',
         'Donating Member - 2015',
         'Donating Member - No Ads' ] }
         ];
    if (process.env.NODE_ENV === 'development') users.push({username: 'user'});

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

    passport.use(new LocalStrategy(
      function(username, password, done) {
        if (users.length) return done(null, users[0]);
        else return done(null, false);
      }
    ));

    passport.use(new CrowdStrategy({
      crowdServer: process.env.CROWD_URL || "https://crowd.goonfleet.com/crowd/",
      crowdApplication: process.env.CROWD_USERNAME,
      crowdApplicationPassword: process.env.CROWD_PASSWORD,
      retrieveGroupMemberships: process.env.CROWD_GROUPS
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
