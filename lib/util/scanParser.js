module.exports = function() {

	var pub = {};

	var getShipTypeContainer = function (shipType, parsedScanData) {
		var shipTypeContainer = parsedScanData.find(function(shipTypeContainer) {
			if (shipTypeContainer.shipType === shipType) {
				return true;
			}
		});

		return shipTypeContainer || addShipTypeContainer(shipType, parsedScanData);
	};

	var addShipTypeContainer = function (shipType, parsedScanData) {

		var shipTypeContainer = {
			shipType: shipType,
			count: 0,
			details: []
		};

		parsedScanData.push(shipTypeContainer);

		return shipTypeContainer;
	};

	pub.parse = function (rawScanData) {
		var inputRows = rawScanData.split(/\r\n|\r|\n/g),
			parsedScanData = [];

		for (var inputRow in inputRows) {
			inputRow.reverse();

			var distance = inputRow.pop(),
				shipType = inputRow.pop(),
				shipName = inputRow.join(' ');

			var shipTypeContainer = getShipTypeContainer(shipType, parsedScanData);

			shipTypeContainer.count++;
			shipTypeContainer.details.push({
				distance: distance,
				shipName: shipName
			});
		}

		return parsedScanData;
	};

	return pub;
};