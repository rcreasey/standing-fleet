var UI = {

	dim: function(callback) {
		if (!Data.state.dimmed) {
			Data.ui.dim.fadeIn(Data.config.uiSpeed, callback);
		}
	},

	unDim: function(callback) {
		if (!Data.state.dimmed) {
			Data.ui.dim.fadeOut(Data.config.uiSpeed, callback);
		}

		return UI;
	},

	startSpin: function () {
		Data.ui.bottomMenu_spinner
			.fadeIn(Data.config.uiSpeed*4);
	},

	stopSpin: function () {
		Data.ui.bottomMenu_spinner
			.fadeOut(Data.config.uiSpeed*4);
	},

	registerEventHandlers: function () {
		Data.ui.topMenu_members.on('click', $.proxy(UI.tabClick, null, "members"));
		Data.ui.topMenu_events.on('click', $.proxy(UI.tabClick, null, "events"));
		Data.ui.topMenu_scans.on('click', $.proxy(UI.tabClick, null, "scans"));

		Data.ui.bottomMenu_scan.on('click', $.proxy(UIPanels.showScanPanel, null, false));
		Data.ui.bottomMenu_menu.on('click', $.proxy(UIPanels.showMenuPanel, null, false));
	},

	showAlert: function (event) {
		var alert = $(Data.templates.alert(event));

		alert.on('mouseover',function () {
			alert.stop(true, true);
		}).on('mouseout',function () {
			UI.idleAlert(alert);
		});

		Data.ui.alertContainer.append(alert);

		alert.fadeIn(Data.config.uiSpeed, function () {
			UI.idleAlert(alert);
		});
	},

	idleAlert: function (alert) {
		alert.delay(Data.config.alertStay)
			.fadeOut(Data.config.uiSpeed, function() {
				alert.remove();
			});
	},

	setString: function (target, string) {
		switch (target) {
			case "armadaPassword":
				Data.ui.infoStrings_armadaPassword.html(string);
				break;
			case "armadaKey":
				Data.ui.infoStrings_armadaKey.html(string);
				break;
		}
	},

	tabClick: function (tab) {
		if ($('#'+tab).hasClass('active')) return;

		$('#content-wrapper').fadeOut('fast',function(){
			$('.main-content.active, .menu-button.active ').removeClass('active');
			$('.menu-button.' + tab + ', #' + tab).addClass('active');
			$('.menu-button.' + tab).removeClass('blink');
			$('#content-wrapper').fadeIn('fast');
		});
	},

	blinkTab: function (tab) {
		if ($('#'+tab).hasClass('active')) return;
		$('.menu-button.' + tab).addClass('blink');
	},

	getLoadingText: function () {
		var msgs = [
			"Hull tanking",
			"EFT warrioring",
			"Smacktalking",
			"Shitpoasting",
			"Lemming'ing",
			"Clicking jump instead of bridge",
			"Burning guns",
			"Fitting a windicator",
			"Burning point",
			"Getting the pod"
		];
		return msgs[Math.floor(Math.random()*msgs.length)] + "...";
	}
}
