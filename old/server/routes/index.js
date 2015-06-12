var express = require('express')
  , router = express.Router()
  , checks = require(__dirname + '/../middleware/checks')
  , validate = require(__dirname + '/../middleware/validate')
  , application = require(__dirname + '/../controllers/application')

router.route('/login')
  .get(checks.ssl_headers)
  .get(checks.redirect_to_https)
  .get(application.login);

router.route('/login')
  .post(checks.ssl_headers)
  .post(checks.redirect_to_https)
  .post(validate.authentication)
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
  
router.route('/overview')
  .get(validate.is_authenticated)
  .get(validate.is_authorized)
  .get(application.overview);

router.route('/join/:fleetKey/?')
  .get(application.join)
  
router.route('/:fleetKey/?')
  .get(validate.headers)
  .get(application.index);

router.route('/')
  .get(validate.igb)
  .get(application.index);

module.exports = router;
