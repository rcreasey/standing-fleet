var express = require('express')
  , router = express.Router()
  , checks = require(__dirname + '/../middleware/checks')
  , validate = require(__dirname + '/../middleware/validate')
  , application = require(__dirname + '/../controllers/application')

router.get('/login', [ checks.redirect_if_authenticated, application.login ]);
router.post('/login', application.authenticate );
router.get('/logout', application.logout );
router.get('/link', [ checks.if_authenticated, application.link ]);
router.post('/link', [ checks.if_authenticated, application.link_pilot ]);
router.get('/unlink', [ checks.if_authenticated, application.unlink ]);
router.get('/', application.index)

module.exports = router;
