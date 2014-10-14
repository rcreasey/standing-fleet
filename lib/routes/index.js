var express = require('express')
  , passport = require('passport')
  , router = express.Router()
  , checks = require(__dirname + '/../middleware/checks')
  , validate = require(__dirname + '/../middleware/validate')
  , application = require(__dirname + '/../controllers/application')

router.route('/login')
      .get(checks.redirect_if_authenticated)
      .get(application.login );

router.route('/login')
      .post(passport.authenticate('atlassian-crowd',
              { failureRedirect:'/login', failureFlash:"Invalid username or password." }))
      .post(application.authenticate);

router.route('/logout')
      .get(application.logout);

router.route('/link')
      .get(checks.if_authenticated)
      .get(application.link);

router.route('/link')
      .post(checks.if_authenticated)
      .post(application.link_pilot);

router.route('/unlink')
      .get(checks.if_authenticated)
      .get(application.unlink);

router.route('/:fleetKey/?')
      .get(application.index);

router.route('/')
      .get(application.index);

module.exports = router;
