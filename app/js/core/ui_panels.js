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
    var fleet_link = Data.config.domain + Data.state.fleet.key + '/';

    var panel = {
      type: 'options',
      icon: 'settings',
      title: 'Standing Fleet Options',
      footer: '&copy; 2015 Goonswarm Federation',
      closeable: true,
      formitems: [
        {button: {legend: 'Fleet Actions', class: 'reload-fleet no-margin', text: 'Reload Standing Fleet', onClick: 'location.reload()'}},
        {button: {class: 'leave-fleet', text: 'Leave Standing Fleet', onClick: 'leaveFleet()'}},
        {input:  {legend: 'Fleet Name', label: 'Fleet Name', class: 'info-string', value: Data.state.fleet.name, readonly: true}},
        {input:  {legend: 'Pilot Key', label: 'Pilot Key', class: 'info-string', value: Data.state.self.key, readonly: true}},
        {input:  {legend: 'Fleet Key', label: 'Fleet Key', class: 'info-string', value: Data.state.fleet.key, readonly: true}},
        {input:  {legend: 'Fleet URL', label: 'Fleet URL', class: 'info-string', value: fleet_link, readonly: true}}
      ]
    };

    if (Data.state.fleet.password) panel.formitems.push( {input:  {legend: 'Fleet Password', label: 'Fleet Password', class: 'info-string',
                                                                    value: Data.state.fleet.password, readonly: true}} );

    UIPanels.showPanel(panel, callback);
  },

  showStartPanel: function (error, callback) {
    var panel = {
      type: 'start',
      logo: true,
      fleets: [],
      formitems: [
        {button: {class: 'submit-create', text: 'Create Fleet', onClick: 'UIPanels.showCreatePanel()'}},
        {button: {class: 'leave-fleet', text: 'Leave Standing Fleet', onClick: 'leaveFleet()'}}
      ],
      error: error,
      footer: '<a href="/docs/">What is this site?</a><br />&copy 2015 Goonswarm Federation'
    };
    
    Server.listFleets(function (error, data) {
      if (error) { return handleError(error); }
      panel.fleets = data.events;
      UIPanels.showPanel(panel, callback);
      UI.update_scrollables();
    });
    
  },

  showCreatePanel: function (error, callback) {
    var panel = {
      type: 'create',
      logo: true,
      text: 'To create a private fleet, set a password',
      formitems: [
        {input:  {label: 'Fleet Name', id: 'create-fleet-name', class: 'submit-key'}},
        {input:  {label: 'Fleet Password', id: 'create-fleet-password', class: 'submit-key'}},
        {input:  {label: 'Fleet Description', id: 'create-fleet-description', class: 'submit-key'}},
        {button: {class: 'submit-key', text: 'Create Fleet', onClick: 'createFleetButtonClick(this)'}},
        {submit: {class: 'submit-join', text: '<i class="fa fa-arrow-circle-left"></i> Go Back', onClick: 'UIPanels.showStartPanel()'}}
      ],
       error: error
     };

     UIPanels.showPanel(panel, callback);
  },

  showJoinPanel: function (error, callback) {
    var panel = {
      type: 'create',
      logo: true,
      formitems: [
        {input:  {label: 'Fleet Key', id: 'join-fleet-key', class: 'fleet-key'}},
        {submit: {class: 'submit-join', text: 'Join Fleet', onClick: 'joinFleetButtonClick(this)'}},
        {submit: {class: 'submit-join', text: '<i class="fa fa-arrow-circle-left"></i> Go Back', onClick: 'UIPanels.showStartPanel()'}}
      ],
       error: error
     };

     UIPanels.showPanel(panel, callback);
  },

  showPasswordPanel: function (error, callback) {
    var panel = {
      type: 'password',
      logo: true,
      error: {message: 'Authorization required.'},
      formitems: [
        {input:  {label: 'Fleet Password', id: 'join-fleet-password', class: 'submit-key'}},
        {button: {class: 'submit-key', text: 'Join Fleet', onClick: 'submitPasswordButtonClick(this)'}},
        {submit: {class: 'submit-join', text: '<i class="fa fa-arrow-circle-left"></i> Cancel', onClick: 'UIPanels.redirectToBasePath()'}}
      ],
     };

     UIPanels.showPanel(panel, callback);
  },

  updateHostileDetailsPanel: function (hostileId) {
    var hostile = HostileList.findHostile(hostileId);

    var panel = {
      type: 'options',
      icon: 'options',
      title: hostile.characterName,
      text: 'Confirm details of hostile pilot:',
      formitems: [
        {input:  {hidden: true, id: 'hostile-key', value: hostile.key}},
        {input:  {hidden: true, id: 'hostile-id', value: hostile.characterId}},
        {input:  {hidden: true, id: 'hostile-name', value: hostile.characterName}},
        {input:  {hidden: true, id: 'hostile-system-name', value: hostile.systemName}},
        {input:  {hidden: true, id: 'hostile-system-id', value: hostile.systemId}},
        {input:  {label: 'Ship Type', id: 'hostile-ship-type', value: hostile.shipType} },
        {checkbox: {label: 'Is Docked', id: 'hostile-is-docked', checked: hostile.is_docked}},
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
  
  updateWormholeLinkPanel: function (button, from_id, to_id) {
    var from_system = Data.systems[ from_id ];
    var to_system = Data.systems[ to_id ];

    var panel = {
      type: 'wormhole-update',
      icon: 'wormhole',
      from: from_system,
      to: to_system,
      closeable: true
    };

    UIPanels.showPanel(panel);
    
    $('#type-a').typeahead({
      hint: true,
      highlight: true,
      minLength: 1
    },
    {
      displayKey: 'value',
      source: UIPanels.substringMatcher($.map(Data.wormhole_types, function(t) { return t.code; }))
    });  
    
    $('#type-b').typeahead({
      hint: true,
      highlight: true,
      minLength: 1
    },
    {
      displayKey: 'value',
      source: UIPanels.substringMatcher($.map(Data.wormhole_types, function(t) { return t.code; }))
    });
    
    $("#sig-a").focus();
  },
  
  updateWormholeTraversalPanel: function (button, from_id, to_id) {
    var from_system = Data.systems[ from_id ];
    var to_system = Data.systems[ to_id ];

    var panel = {
      type: 'wormhole-traversal',
      icon: 'wormhole',
      from: from_system,
      to: to_system,
      closeable: true
    };

    UIPanels.showPanel(panel);
  },

  showStatusPanel: function (callback) {
    var panel = {
      type: 'hostiles',
      icon: 'reportHostile',
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
      icon: 'scan',
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
        {button: {text: 'Cancel', class: 'abort-pending', onClick: 'leaveFleetButtonClick(this)'}}
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
    var compiledPanel = (params.type === 'start') ? $(Data.templates.start(params)) : $(Data.templates.panel(params));
    if (params.type === 'wormhole-update') compiledPanel = $(Data.templates.wormhole_update_panel(params));
    if (params.type === 'wormhole-traversal') compiledPanel = $(Data.templates.wormhole_update_traversal(params));
    
    if (Data.ui.dim.children().length) {

      Data.ui.dim.children().remove();
      compiledPanel
        .css('display','none')
        .appendTo(Data.ui.dim)
        .fadeIn(Data.config.uiSpeed, function () {
          $(this).find('.textinput').focus().on('keydown', function (event) {
            if (event.keyCode == 13) {
              $(this).siblings('.submit').children('a').click();
              return false;
            }
          });
          if (callback) callback();
        });

    } else {

      compiledPanel.appendTo(Data.ui.dim);
      UI.dim(function () {
        // text input fields
        compiledPanel.find('.textinput').focus().on('keydown', function (event) {
          if (event.keyCode == 13) {
            $(this).siblings('.submit').children('a').click();
            return false;
          }
        });
        // typeahead fields
        compiledPanel.find('.tt-input').focus().on('keydown', function (event) {
          if (event.keyCode == 13) {
            $(this).parentsUntil('.group').parent().siblings('.submit').children('a').click();
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
