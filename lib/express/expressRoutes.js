module.exports = function (requestValidator, statusAction, pollAction, joinAction, createAction, leaveAction, postScanAction, logger) {

	var pub = {};

	pub.getRoutes = {

		'/api/create' : function (req, res) {
			requestValidator.validateHeaders(req, res, function () {
				logger.log('Processing \'create\' request', 0)
				createAction.run(req, res);
			});
		},

		'/api/create/:armadaPassword' : function (req, res) {
			requestValidator.validateHeaders(req, res, function () {
				logger.log('Processing \'create\' request with password', 0)
				createAction.run(req, res);
			});
		},

		'/api/leave' : function (req, res) {
			requestValidator.validateHeaders(req, res, function () {
				logger.log('Processing \'leave\' request', 0)
				leaveAction.run(req, res);
			});
		},

		'/api/status' : function (req, res) {
			requestValidator.validateHeaders(req, res, function () {
				logger.log('Processing \'status\' request', 0)
				statusAction.run(req, res);
			});
		},

		'/api/join/:armadaKey' : function (req, res) {
			requestValidator.validateHeaders(req, res, function () {
				logger.log('Processing \'join\' request', 0)
				joinAction.run(req, res);
			});
		},

		'/api/join/:armadaKey/:armadaPassword' : function (req, res) {
			requestValidator.validateHeaders(req, res, function () {
				logger.log('Processing \'join\' request with password', 0)
				joinAction.run(req, res);
			});
		},

		'/api/poll/:lastPollTs' : function (req, res) {
			requestValidator.validateHeaders(req, res, function () {
				requestValidator.validateSession(req, res, function () {
					requestValidator.validatePoll(req, res, function () {
						logger.log('Processing \'poll\' request', 0)
						pollAction.run(req, res);
					});
				});
			});
		}
	};

	pub.postRoutes = {
		'/api/postscan' : function (req, res) {
			requestValidator.validateHeaders(req, res, function () {
				requestValidator.validateSession(req, res, function () {
					logger.log('Processing \'postscan\' request', 0)
					postScanAction.run(req, res);
				});
			});
		},
	};

	return pub;
};