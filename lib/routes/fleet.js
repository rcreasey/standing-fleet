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

module.exports = router;
