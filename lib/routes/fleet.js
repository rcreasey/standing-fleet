var express = require('express')
  , router = express.Router()
  , validate = require(__dirname + '/../middleware/validate')
  , fleet = require(__dirname + '/../controllers/fleet')

router.route('/fleet/join/:fleetKey')
      .get(validate.headers)
      .get(fleet.join);

router.route('/fleet/join/:fleetKey/:fleetPassword')
      .get(validate.headers)
      .get(fleet.join);

router.route('/fleet/leave')
      .get(validate.headers)
      .get(fleet.leave);

router.route('/fleet/status')
      .get(validate.headers)
      .get(fleet.status);

router.route('/fleet/poll/:lastPollTs')
      .get(validate.headers, validate.session, validate.poll)
      .get(fleet.poll);

router.route('/fleet/create')
      .post(validate.headers)
      .post(fleet.create);

router.route('/fleet/status')
      .post(validate.headers, validate.session)
      .post(fleet.update_status)

router.route('/fleet/scan')
      .post(validate.headers, validate.session)
      .post(fleet.add_scan);

router.route('/fleet/details')
      .post(validate.headers, validate.session)
      .post(fleet.update_hostile)

module.exports = router;
