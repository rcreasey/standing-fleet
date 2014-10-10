var express = require('express')
  , router = express.Router()
  , validate = require(__dirname + '/../middleware/validate')
  , application = require(__dirname + '/../controllers/application')

router.get('/', application.index);

router.get('/login')
      .get(validate.headers)
      .get(application.login);

module.exports = router;

    //
		// '/login' : [ expressMiddlewares.redirectToLinkIfAuthenticated
		// 					 , loginAction.run ],
    //
		// '/logout' : [ function (req, res) { req.logout(); res.redirect('/'); }],
    //
		// '/link' : [ expressMiddlewares.ensureAuthenticated
		// 					, linkAction.run
		// ],
    //
		// '/unlink' : [ expressMiddlewares.ensureAuthenticated
		// 					, unlinkAction.run
		// ],
