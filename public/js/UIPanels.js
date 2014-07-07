var UIPanels = {

	showMenuPanel: function(callback) {
		var panel = {
			type: 'options',
			image: 'panel-settings.png',
			closeable: true,
			buttons: [
				{
					class: 'reload-armada no-margin',
					text: 'Reload Standing Fleet',
					onClick: 'location.reload()'
				},
				{
					class: 'leave-armada',
					text: 'Leave Standing Fleet',
					onClick: 'leaveArmada()'
				}
			],
		};

		UIPanels.showPanel(panel, callback);
	},

	showJoinPanel: function (error, callback) {
		var panel = {
			type: 'start',
			image: 'panel-logo.png',
			textinputs: [{
				legend: 'Enter Fleet key',
				class: 'armada-key'
			}],
			buttons: [
				{
					class: 'submit-join',
					text: 'Join',
					onClick: 'joinArmadaButtonClick(this)'
				},
				{
					class: 'submit-create',
					text: 'Create new',
					onClick: 'UIPanels.showCreatePanel()'
				}
			],
			error: error
		};

		UIPanels.showPanel(panel, callback);
	},

	showCreatePanel: function (error, callback) {
		var panel = {
			type: 'create',
			image: 'panel-logo.png',
			textinputs: [{
					legend: 'Choose Standing Fleet password.<br />Blank makes Fleet public.',
					class: 'armada-password'
			}],
			buttons: [
				{
					class: 'submit-key',
					text: 'Create',
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
			image: 'panel-logo.png',
			text: 'Authorization required.',
			textinputs: [{
					legend: 'Enter Standing Fleet password',
					class: 'armada-password'
			}],
			buttons: [
				{
					class: 'submit-password',
					text: 'Join',
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

	showScanPanel: function (callback) {
		var panel = {
			type: 'scan',
			image: 'panel-scan.png',
			textinputs: [{
				legend: 'Paste scan results below',
				class: 'scan-data',
			}],
			buttons: [{
				class: 'submit-scan',
				text: 'Share',
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
			text: text || UI.getLoadingText(),
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
	},

	submitSystemStatus: function (status) {
		alert(Data.ui.current_system.text() + " status " + status);		
	}
};
