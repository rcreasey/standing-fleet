var UIPanels = {

	substringMatcher: function(strs) {
	  return function findMatches(q, cb) {
	    var matches, substrRegex;
	    matches = [];
	    substrRegex = new RegExp(q, 'i');

	    $.each(strs, function(i, str) {
	      if (substrRegex.test(str)) matches.push({ value: str });
	    });

	    cb(matches);
	  };
	},

	showMenuPanel: function(callback) {
		var fleet_link = Data.config.domain + Data.state.armada.key;

		var panel = {
			type: 'options',
			image: 'panel-settings.png',
			title: 'Standing Fleet Options',
			closeable: true,
			formitems: [
				{button: {legend: 'Fleet Actions', class: 'reload-armada no-margin', text: 'Reload Standing Fleet', onClick: 'location.reload()'}},
				{button: {class: 'leave-armada', text: 'Leave Standing Fleet', onClick: 'leaveArmada()'}},
				{input:  {legend: 'Fleet URL (triple click to select)', label: 'Fleet URL', id: 'info-string-fleet-key', value: fleet_link, readonly: true}},
				{input:  {legend: 'Fleet Key', label: 'Fleet Key', id: 'info-string-fleet-key', value: Data.state.armada.key, readonly: true}}
			]
		};

		if (Data.state.armada.password) panel.formitems.push( {input:  {legend: 'Fleet Password', label: 'Fleet Password', id: 'info-string-fleet-password',
																																		value: Data.state.armada.password, readonly: true}} );

		UIPanels.showPanel(panel, callback);
	},

	showJoinPanel: function (error, callback) {
		var panel = {
			type: 'start',
			title: '<img id="logo" src="/images/panel-logo.png" alt="Standing Fleet" />',
			formitems: [
				{button: {class: 'submit-create', text: 'Create Fleet', onClick: 'UIPanels.showCreatePanel()'}},
				{input:  {label: 'Fleet Key', id: 'join-fleet-key', class: 'armada-key'}},
				{submit: {class: 'submit-join', text: 'Join Fleet', onClick: 'joinArmadaButtonClick(this)'}},
				{button: {class: 'leave-armada', text: 'Leave Standing Fleet', onClick: 'leaveArmada()'}},
			],
			error: error
		};

		UIPanels.showPanel(panel, callback);
	},

	showCreatePanel: function (error, callback) {
		var panel = {
			type: 'create',
			title: '<img id="logo" src="/images/panel-logo.png" alt="Standing Fleet" />',
			formitems: [
				{input:  {label: 'Fleet Password', id: 'create-fleet-password', class: 'submit-key'}},
				{button: {class: 'submit-key', text: 'Create Fleet', onClick: 'createArmadaButtonClick(this)'}},
				{submit: {class: 'submit-join', text: '<i class="fa fa-arrow-circle-left"></i> Go Back', onClick: 'UIPanels.showJoinPanel()'}}
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
			formitems: [
				{input:  {label: 'Fleet Password', id: 'join-fleet-password', class: 'submit-key'}},
				{button: {class: 'submit-key', text: 'Join Fleet', onClick: 'submitPasswordButtonClick(this)'}},
				{submit: {class: 'submit-join', text: '<i class="fa fa-arrow-circle-left"></i> Cancel', onClick: 'UIPanels.redirectToBasePath()'}}
			],
	 		error: error
	 	};

	 	UIPanels.showPanel(panel, callback);
	},

	updateHostileDetailsPanel: function (hostileId) {
		var hostile = HostileList.findHostile(hostileId);

		var panel = {
			type: 'options',
			image: 'panel-options.png',
			title: hostile.name,
			text: 'Confirm details of hostile pilot:',
			formitems: [
				{input:  {hidden: true, id: 'hostile-key', value: hostile.key}},
				{input:  {hidden: true, id: 'hostile-id', value: hostile.id}},
				{input:  {hidden: true, id: 'hostile-name', value: hostile.name}},
				{input:  {label: 'Ship Type', id: 'hostile-ship-type', value: hostile.shipType} },
				{submit: {text: 'Update Details', onClick: 'submitHostileDetailsClick(this)'}}
			],
			closeable: true
		};

		UIPanels.showPanel(panel);

		$('#hostile-ship-type').typeahead({
		  hint: false,
		  highlight: true,
		  minLength: 1
		},
		{
		  name: 'ships',
		  displayKey: 'value',
		  source: UIPanels.substringMatcher($.map(Data.ships, function(s) { return s.name; }))
		});
	},

	showStatusPanel: function (callback) {
		var panel = {
			type: 'hostiles',
			image: 'panel-scan.png',
			title: Data.ui.currentSystem.text(),
			formitems: [
				{textinput:  {legend: 'Copy and paste pilots out of local below', id: 'status-data', class: 'status-data'}},
				{submit: {text: 'Update Status', onClick: 'submitStatusButtonClick(this)'}}
			],
			closeable: true
		};

		UIPanels.showPanel(panel, callback);
	},

	showScanPanel: function (callback) {
		var panel = {
			type: 'scan',
			image: 'panel-scan.png',
			title: Data.ui.currentSystem.text(),
			formitems: [
				{textinput:  {legend: 'Paste scan results below', id: 'scan-data', class: 'scan-data'}},
				{submit: {text: 'Send Scan', onClick: 'submitScanButtonClick(this)'}}
			],
			closeable: true
		};

		UIPanels.showPanel(panel, callback);
	},

	showPendingPanel: function (callback) {
		var panel = {
			type: 'pending',
			image: 'spinner.gif',
			text: 'Waiting for Standing Fleet to accept...',
			formitems: [
				{button: {text: 'Cancel', class: 'abort-pending', onClick: 'leaveArmadaButtonClick(this)'}}
			],
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
