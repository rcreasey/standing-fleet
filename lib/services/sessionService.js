module.exports = function (memberService, settings) {

	var pub = {};

	pub.initialize = function (req, armadaKey, memberKey) {
		req.session.armadaKey = armadaKey;
		req.session.memberKey = memberKey;
		req.session.lastPollTs = Date.now() - settings.minPollInterval;
		req.session.lastStatusTs = Date.now() - settings.minPollInterval;
	};

	pub.checkIfValid = function (req, callback) {
		if (!req.session.armadaKey || !req.session.memberKey) {
			return callback(null, false);
		}

		memberService.getByArmadaKey(req.session.armadaKey, function (error, members) {
			if (error) return callback(error, null);

			for (var i in members) {
				if (members[i].key === req.session.memberKey) {
					return callback(null, true);
				}
			}
			callback(null, false);
		});
	};

	pub.verifyPoll = function (req) {
		var msSinceLastPoll = (Date.now() - req.session.lastPollTs);
		if (msSinceLastPoll > settings.minPollInterval) {
			req.session.lastPollTs = Date.now();
			return true;
		}
		return false;
	};

	pub.verifyStatus = function (req) {
		var msSinceLastPoll = Date.now() - req.session.lastStatusTs;
		if (msSinceLastPoll > settings.minPollInterval) {
			req.session.lastStatusTs = Date.now();
			return true;
		}
		return false;
	};

	return pub;
};
