var express = require('express')
  , router = express.Router()
  , validate = require(__dirname + '/../middleware/validate')
  , map = require(__dirname + '/../controllers/map')

router.route('/vicinity')
  .get(validate.headers)
  .get(map.vicinity);

router.route('/regions')
  .get(map.show_regions);

router.route('/wormholes')
// .get(validate.is_authorized)
  .get(map.show_wormholes);

router.route('/regions/:region_name')
  .get(map.show_region);

router.route('/systems/:system_name')
  .get(map.show_system);

router.route('/jumps/:from_id/:to_id')
  .post(validate.headers, validate.session)
  .post(map.update_jump)
    
module.exports = router;
