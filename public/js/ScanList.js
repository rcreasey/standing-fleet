var ScanList = {

	clear: function () {
		log('Clearing scan list...');
		Data.scans = [];
		Data.ui.scans.empty();
	},

  addStatus: function(reported_status, pilots) {
		var status = {systemId: Data.ui.currentSystem.data('systemId')
					      , systemName: Data.ui.currentSystem.text(), pilots: []
			      		, reporterId: Data.state.self.id
			      		, reporterName: Data.state.self.name
			      		, pilots: ScanList.parseLocal(pilots)};

		if (reported_status) status.text = reported_status;
		return status;
	},

	addScan: function (scan) {
		scan.time = Util.getTime(scan.ts);
		Data.scans.push(scan);

		if (Data.scans.length > Data.config.maxScans) {
			Data.ui.scans.children().last().remove();
			Data.scans.pop();
		}

		ScanList.renderScan(scan);
	},

	renderScan: function (scan) {
		var element = $(Data.templates.scan(scan));
		Data.ui.scans.prepend(element);
	},

	toggleCollapse: function (element) {
		var $element = $(element);

		if ($element.hasClass('active')) {
			$element.siblings('.collapsible').hide();
			$element.removeClass('active');
		} else {
			$element.siblings('.collapsible').show();
			$element.addClass('active');
		}

		return UI;
	},

	parse: function (rawScanData) {
		var inputRows = rawScanData.split(/\r\n|\r|\n/g),
			parsedScanData = [];

		for (var inputRowIndex in inputRows) {
			var inputRowArray = inputRows[inputRowIndex].split(/\t/g);

			var distance = inputRowArray.pop(),
				shipType = inputRowArray.pop(),
				shipName = inputRowArray.join(' ');

			if (!Util.isShip(shipType)) continue;

			var shipTypeContainer = ScanList.getShipTypeContainer(shipType, parsedScanData);

			shipTypeContainer.count++;
			shipTypeContainer.details.push({
				distance: distance,
				shipClass: shipType,
				shipName: shipName
			});
		}

		parsedScanData.sort(ScanList.scanDataSorter);

		return parsedScanData;
	},

	parseLocal: function (local) {
		var parsedLocal = [];

		if (local) {
			local.split("\n").forEach(function (pilot) {
				if (pilot.length > 0) parsedLocal.push(pilot);
			});
		}

		return parsedLocal;
	},

	getShipTypeContainer: function (shipType, parsedScanData) {
		var foundShipTypeContainer = false;

		parsedScanData.forEach(function (shipTypeContainer) {
			if (shipTypeContainer.shipType === Data.ships[shipType].class[0]) {
				foundShipTypeContainer = shipTypeContainer;
			}
		});

		return foundShipTypeContainer || ScanList.addShipTypeContainer(shipType, parsedScanData);
	},

	addShipTypeContainer: function (shipType, parsedScanData) {

		var shipTypeContainer = {
			shipType: Data.ships[shipType].class[0],
			count: 0,
			details: []
		};

		parsedScanData.push(shipTypeContainer);

		return shipTypeContainer;
	},

	scanDataSorter: function (shipType1, shipType2) {
		if (shipType1.count === shipType2.count) return 10;
		else if (shipType1.count < shipType2.count) return 1;
		else return -1;
	}

}
