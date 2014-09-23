module.exports = function (requestValidator, passport, expressMiddlewares, indexAction, statusAction, pollAction, joinAction, linkAction, unlinkAction, createAction, leaveAction, postLinkAction, postScanAction, postStatusAction, postDetailsAction, loginAction, logoutAction) {

	var pub = {};

	pub.getRoutes = {
		'/login' : [ expressMiddlewares.redirectToLinkIfAuthenticated
							 , loginAction.run ],

		'/logout' : [ logoutAction.run ],

		'/link' : [ expressMiddlewares.ensureAuthenticated
							, linkAction.run
		],

		'/unlink' : [ expressMiddlewares.ensureAuthenticated
							, unlinkAction.run
		],

		'/api/create' : [ requestValidator.validateHeaders
										, createAction.run
		],

		'/api/create/:armadaPassword' : [ requestValidator.validateHeaders
																		, createAction.run
		],

		'/api/leave' : [ requestValidator.validateHeaders
									 , leaveAction.run
		],

		'/api/status' : [ requestValidator.validateHeaders
										, statusAction.run
		],

		'/api/join/:armadaKey' : [ requestValidator.validateHeaders
														 , joinAction.run
		],

		'/api/join/:armadaKey/:armadaPassword' : [ requestValidator.validateHeaders
																						 , joinAction.run
		],

		'/api/poll/:lastPollTs' : [ requestValidator.validateHeaders
															, requestValidator.validateSession
															, requestValidator.validatePoll
															, pollAction.run
		],

		'/' : [ indexAction.run	]
	};

	pub.postRoutes = {
		'/login': [ passport.authenticate('atlassian-crowd', { failureRedirect:'/login', failureFlash:"Invalid username or password." })
							, function (req, res) { res.redirect('/link/'); }
		],

		'/link': [ expressMiddlewares.ensureAuthenticated
						 , postLinkAction.run
		],

		'/api/scan' : [ requestValidator.validateHeaders
									, requestValidator.validateSession
									, postScanAction.run
		],

		'/api/status' : [ requestValidator.validateHeaders
										, requestValidator.validateSession
										, postStatusAction.run
		],

		'/api/details' : [ requestValidator.validateHeaders
										 , requestValidator.validateSession
										 , postDetailsAction.run
		],
	};

	return pub;
};
