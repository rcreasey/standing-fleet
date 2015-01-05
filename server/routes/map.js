var express = require('express')
  , router = express.Router()
  , validate = require(__dirname + '/../middleware/validate')
  , map = require(__dirname + '/../controllers/map')

router.route('/region/:region_name')
  .get(map.show_region);

router.route('/system/:system_name')
  .get(map.show_system);
  
module.exports = router;
