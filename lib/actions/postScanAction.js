module.exports = function (scanService, eventService, memberService, headerParser, errorResponse, successResponse, settings) {

	var pub = {};

	var checkScanDataIntegrity = function (scan) {
		var shipQty = 0;

		for (var index in scan) {
			if (!typeof(scan) === 'object'
				|| !scan[index].shipType
				|| !scan[index].count
				|| !scan[index].details
				|| !typeof scan[index].details === 'object') {

				return false;
			}

			for (var detailIndex in scan[index].details) {
				if (!scan[index].details[detailIndex].distance
					|| !scan[index].details[detailIndex].shipName) {

					return false;
				}
				shipQty++;
			}
		}

		return !(shipQty > settings.scanMaxShips || shipQty < settings.scanMinShips);
	};

	pub.run = function (req, res) {
		var scanData = req.body.scanData;
		if (!checkScanDataIntegrity(scanData)) {
			return errorResponse.respond(res, 'scan', 'Invalid scan data.');
		}

		scanService.addAndGet(headerParser.parse(req), scanData, req.session.armadaKey, function (error, scan) {
			if (error) return errorResponse.respond(res, 'scan', 'Unable to add scan');

			memberService.getByKey(req.session.memberKey, function (error, member) {
				if (error) return errorResponse.respond(res, 'member', 'Error fetching member');

				console.log('postScanAction');
				console.log(scan);
				eventService.addAndGet('scanPosted', scan, req.session.armadaKey, function (error, event) {
					successResponse.respond(res);
				});
			});
		});
	};

	return pub;
};
