var express = require('express')
  , passport = require('passport')
  , router = express.Router()
  , checks = require(__dirname + '/../middleware/checks')
  , validate = require(__dirname + '/../middleware/validate')
  , application = require(__dirname + '/../controllers/application')

router.route('/login')
  .get(application.login);

router.route('/login')
  .post(passport.authenticate('atlassian-crowd',
  { failureRedirect:'/login', failureFlash:"Invalid username or password." }))
  .post(application.authenticate);

router.route('/logout')
  .get(application.logout);

router.route('/link')
  .get(validate.is_authenticated)
  .get(application.link);

router.route('/link')
  .post(validate.is_authenticated)
  .post(application.link_pilot)
  .post(application.link);

router.route('/unlink')
  .get(validate.is_authenticated)
  .get(application.unlink)
  .get(application.link);

router.route('/:fleetKey/?')
  .get(application.index);

router.route('/')
  .get(validate.igb)
  .get(application.index);

module.exports = router;
