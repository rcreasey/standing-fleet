var express = require('express')
  , router = express.Router()
  , validate = require(__dirname + '/../middleware/validate')
  , reports = require(__dirname + '/../controllers/reports')

router.route('/')
  .get(validate.is_authenticated)
  .get(validate.is_authorized)
  .get(reports.list);
      
module.exports = router;
