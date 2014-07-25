var UIPanels = {

	showMenuPanel: function(callback) {
		var panel = {
			type: 'options',
			image: 'panel-settings.png',
			title: 'Standing Fleet Options',
			closeable: true,
			formitems: [
				{button: {class: 'reload-armada no-margin', text: 'Reload Standing Fleet', onClick: 'location.reload()'}},
				{button: {class: 'leave-armada', text: 'Leave Standing Fleett', onClick: 'leaveArmada()'}}
			]
		};

		UIPanels.showPanel(panel, callback);
	},

	showJoinPanel: function (error, callback) {
		var panel = {
			type: 'start',
			title: '<img id="logo" src="/images/panel-logo.png" alt="Standing Fleet" />',
			formitems: [
				{button: {class: 'submit-create', text: 'Create Fleet', onClick: 'UIPanels.showCreatePanel()'}},
				{textinput: {legend: 'Fleet Key', class: 'armada-key'}},
				{submit: {class: 'submit-join', text: 'Join Fleet', onClick: 'joinArmadaButtonClick(this)'}}
			],
			error: error
		};

		UIPanels.showPanel(panel, callback);
	},

	showCreatePanel: function (error, callback) {
		var panel = {
			type: 'create',
			title: '<img id="logo" src="/images/panel-logo.png" alt="Standing Fleet" />',
			textinputs: [{
					legend: 'Choose a Standing Fleet key.<br />Blank makes the fleet public.',
					class: 'armada-password'
			}],
			buttons: [
				{
					class: 'submit-key',
					text: 'Create Fleet',
					onClick: 'createArmadaButtonClick(this)'
				},
				{
					class: 'join-armada',
					text: '<i class="fa fa-arrow-circle-left"></i> Go Back',
					onClick: 'UIPanels.showJoinPanel()'
				}
	 		],
	 		error: error
	 	};

	 	UIPanels.showPanel(panel, callback);
	},

	showPasswordPanel: function (error, callback) {
		var panel = {
			type: 'password',
			title: '<img id="logo" src="/images/panel-logo.png" alt="Standing Fleet" />',
			text: 'Authorization required.',
			textinputs: [{
					legend: 'Enter Standing Fleet password',
					class: 'armada-password'
			}],
			buttons: [
				{
					class: 'submit-password',
					text: 'Join Fleet',
					onClick: 'submitPasswordButtonClick(this)'
				},
				{
					class: 'cancel',
					text: 'Cancel',
					onClick: 'Util.redirectToBasePath()'
				}
	 		],
	 		error: error
	 	};

	 	UIPanels.showPanel(panel, callback);
	},

	showHostileOptionsPanel: function (hostileId) {
		var hostile = HostileList.findHostile(hostileId);

		var panel = {
			type: 'options',
			image: 'panel-options.png',
			buttons: [
				{ text: 'Set destination: ' + hostile.systemName, class: 'no-margin', onClick: 'CCPEVE.setDestination(' + hostile.systemId + ')' },
				{ text: 'zKillboard: ' + hostile.name, class: 'no-margin', link: 'https://zkillboard.com/search/' + encodeURIComponent(hostile.name) },
				{ text: 'Eve-Kill: ' + hostile.name, link: 'http://eve-kill.net/?a=search&searchtype=pilot&searchphrase=' + encodeURIComponent(hostile.name) }
			],
			closeable: true
		};

		UIPanels.showPanel(panel);
	},

	updateHostileDetailsPanel: function (hostileId) {
		var hostile = HostileList.findHostile(hostileId);

		var panel = {
			type: 'options',
			image: 'panel-options.png',
			title: hostile.name,
			text: 'Confirm details of hostile pilot:',
			formitems: [
				{select: {label: 'Ship Type', id: 'shipType', values: Data.ship_types,	selected: hostile.shipTypeId} },
				{input:  {label: 'Ship Name', id: 'shipName', value: hostile.shipName}},
				{submit: {text: 'Update Details'}}
			],
			closeable: true
		};

		UIPanels.showPanel(panel);
	},

	showMemberOptionsPanel: function (memberId) {
		var member = MemberList.findMember(memberId);

		var panel = {
			type: 'options',
			image: 'panel-options.png',
			buttons: [
				{ text: 'Set destination: ' + member.systemName, class: 'no-margin', onClick: 'CCPEVE.setDestination(' + member.systemId + ')' },
				{ text: 'zKillboard: ' + member.name, class: 'no-margin', link: 'https://zkillboard.com/search/' + encodeURIComponent(member.name) },
				{ text: 'Eve-Kill: ' + member.name, link: 'http://eve-kill.net/?a=search&searchtype=pilot&searchphrase=' + encodeURIComponent(member.name) }
			],
			closeable: true
		};

		UIPanels.showPanel(panel);
	},

	showStatusPanel: function (callback) {
		var panel = {
			type: 'hostiles',
			image: 'panel-scan.png',
			title: Data.ui.currentSystem.text(),
			textinputs: [{
				legend:  'Copy and paste pilots out of local below',
				class: 'status-data',
			}],
			buttons: [{
				class: 'submit-scan',
				text: 'Update Status',
				onClick: 'submitStatusButtonClick(this)'
			}],
			closeable: true
		};

		UIPanels.showPanel(panel, callback);
	},

	showScanPanel: function (callback) {
		var panel = {
			type: 'scan',
			image: 'panel-scan.png',
			title: Data.ui.currentSystem.text(),
			textinputs: [{
				legend: 'Paste scan results below',
				class: 'scan-data',
			}],
			buttons: [{
				class: 'submit-scan',
				text: 'Send Scan',
				onClick: 'submitScanButtonClick(this)'
			}],
			closeable: true
		};

		UIPanels.showPanel(panel, callback);
	},

	showPendingPanel: function (callback) {
		var panel = {
			type: 'pending',
			image: 'spinner.gif',
			text: 'Waiting for Standing Fleet to accept...',
			buttons: [{
				class: 'abort-pending',
				text: 'Cancel',
				onClick: 'leaveArmadaButtonClick(this)'
			}]
		};

		UIPanels.showPanel(panel, callback);
	},

	showLoadingPanel: function (text, callback) {
		var panel = {
			type: 'loading',
			title: text || UI.getLoadingText(),
			image: 'spinner.gif'
		};

		UIPanels.showPanel(panel, callback);
	},

	showPanel: function (params, callback) {
		var panelTemplate = Handlebars.compile($('#panelTemplate').html()),
			compiledPanel = $(panelTemplate(params));

		if (Data.ui.dim.children().length) {

			Data.ui.dim.children().remove();
			compiledPanel
				.css('display','none')
				.appendTo(Data.ui.dim)
				.fadeIn(Data.config.uiSpeed, function () {
					$(this).find('.textinput').focus().on('keydown', function (event) {
						if (event.keyCode == 13) {
							$(this).siblings('.submit-join, .submit-scan').click();
							return false;
						}
					});
					if (callback) callback();
				});

		} else {

			compiledPanel.appendTo(Data.ui.dim);
			UI.dim(function () {
				compiledPanel.find('.textinput').focus().on('keydown', function (event) {
					if (event.keyCode == 13) {
						$(this).siblings('.submit-join, .submit-scan').click();
						return false;
					}
				});
				if (callback) callback();
			});
		}
	},

	hidePanel: function (callback) {
		Data.ui.dim.children().remove();
		UI.unDim(callback);
	}

};
