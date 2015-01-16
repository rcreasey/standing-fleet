var express = require('express')
  , router = express.Router()
  , validate = require(__dirname + '/../middleware/validate')
  , map = require(__dirname + '/../controllers/map')

router.route('/regions/:region_name')
  .get(map.show_region);

router.route('/systems/:system_name')
  .get(map.show_system);

module.exports = router;
