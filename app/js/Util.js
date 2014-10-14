var Util = {

	isShip: function (shipName) {
		return (typeof Data.ships[shipName] !== 'undefined' && Data.ships[shipName].icons !== undefined)
	},

	getShipType: function (shipName) {
		if (Util.isShip(shipName)){
			return Data.ships[shipName].icons[0];
		}
		return 'other';
	},

	getShipIcon: function (shipName) {
		var returnElement 	= $('<div/>');

		if (Util.isShip(shipName)){
			for (var i in Data.ships[shipName].class) {
				returnElement.append($('<img src="/images/ship-icons/ship-icon-' + Data.ships[shipName].icons[i] + '.gif" alt="" />'));
			}
		} else {
			returnElement.append($('<img src="/images/ship-icons/ship-icon-other.gif" alt="Ship type" />'));
		}

		return $('<div/>').append(returnElement).html();
	},

	getTime: function () {
		return moment().utc().format('HH:mm:ss');
	},

	escapeHTML: function (string) {
		return string.replace(/</gi,'&lt;').replace(/>/gi,'&gt;');
	},

	deepClone: function (object) {
		return JSON.parse(JSON.stringify(object));
	},

	getUrlKey: function () {
		var url = window.location.href,
			match = url.match(/[A-z0-9]{17}/);

		return match ? match[0] : false;
	},

	redirectToKeyUrl: function (fleetKey) {
		window.location = location.protocol
			+ '//' + location.hostname
			+ (location.port ? ':' + location.port : '')
			+ '/' + fleetKey + '/';
	},

	redirectToBasePath: function () {
		window.location = location.protocol
			+ '//' + location.hostname
			+ (location.port ? ':' + location.port : '')
			+ '/';
	},

	redirectToLoginPath: function () {
		window.location = location.protocol
			+ '//' + location.hostname
			+ (location.port ? ':' + location.port : '')
			+ '/login/';
	},

	redirectIfNecessary: function (fleetKey, callback) {
		if (!!fleetKey !== !!Util.getUrlKey() || fleetKey !== Util.getUrlKey()) {
			UIPanels.showLoadingPanel('Redirecting to Standing Fleet URL...', function () {
				setTimeout($.proxy(Util.redirectToKeyUrl, null, fleetKey),
					Data.config.pollInterval);
			});
		} else {
			callback();
		}
	}
};
