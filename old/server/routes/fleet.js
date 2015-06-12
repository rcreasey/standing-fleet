var express = require('express')
  , router = express.Router()
  , validate = require(__dirname + '/../middleware/validate')
  , fleet = require(__dirname + '/../controllers/fleet')

router.route('/list')
  .get(validate.headers)
  .get(fleet.list);
  
router.route('/join/:fleetKey')
  .get(validate.headers)
  .get(fleet.join);

router.route('/join/:fleetKey/:fleetPassword')
  .get(validate.headers)
  .get(fleet.join);

router.route('/leave')
  .get(validate.headers)
  .get(fleet.leave);

router.route('/status')
  .get(validate.headers, validate.session)
  .get(fleet.status);

router.route('/poll/:lastPollTs')
  .get(validate.headers, validate.session, validate.poll)
  .get(fleet.poll);

router.route('/create')
  .post(validate.headers)
  .post(fleet.create);

router.route('/status')
  .post(validate.headers, validate.session)
  .post(fleet.report)

router.route('/scan')
  .post(validate.headers, validate.session)
  .post(fleet.add_scan);

router.route('/details')
  .post(validate.headers, validate.session)
  .post(fleet.update_hostile)
  
router.route('/advisory')
  .post(validate.headers, validate.session)
  .post(fleet.update_advisory)

module.exports = router;
