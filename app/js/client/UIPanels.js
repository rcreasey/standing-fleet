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
    var panel = {
      type: 'options',
      icon: 'settings',
      title: 'Standing Fleet Options',
      footer: '&copy; 2014 Goonswarm Federation',
      closeable: true,
      formitems: [
        {checkbox: {legend: 'Clipboard Polling', checked: Data.state.poll.clipboard, onclick: 'UI.togglePolling(this, "clipboard");' }},
        {checkbox: {legend: 'Log Polling', checked: Data.state.poll.log, onclick: 'UI.togglePolling(this, "log");' }}
      ]
    };
    
    if (/^win/.test(process.platform)) {
      panel.formitems.push({input: {legend: 'Log Path', label: 'Log Path', class: 'log-path', value: Data.state.datasources.logs.path.win}})
    } else {
      panel.formitems.push({input: {legend: 'Log Path', label: 'Log Path', class: 'log-path', value: Data.state.datasources.logs.path.darwin}})
    }

    var channels = {group: {legend: 'Intel Channels', formitems: []}};
    for (channel in Data.state.datasources.logs.channels) {
      channels.group.formitems.push(
        {checkbox: {legend: channel, checked: Data.state.datasources.logs.channels[channel], onclick: 'UI.toggleChannel(this, "' + channel + '");' }}
      )
    }
    panel.formitems.push(channels);
    
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
    var compiledPanel = $(Data.templates.panel(params));

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
