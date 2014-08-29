module.exports = function (requestValidator, statusAction, pollAction, joinAction, createAction, leaveAction, postScanAction, postStatusAction, postDetailsAction) {

	var pub = {};

	pub.getRoutes = {

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
	};

	pub.postRoutes = {
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
