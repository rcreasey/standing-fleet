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

  togglePolling: function (checkbox, source) {
    if (source == 'clipboard') Data.state.poll.clipboard = checkbox.checked;
    if (source == 'logs') {
      Data.state.poll.logs = checkbox.checked;
      resetLogPolling();
    }
  },

  toggleChannel: function(checkbox, channel) {
    Data.state.datasources.logs.channels[ channel ] = checkbox.checked;
  },

  updateLogPath: function(input) {
    if (/^win/.test(process.platform)) {
      Data.state.datasources.logs.path.win = input.value;
    } else {
      Data.state.datasources.logs.path.osx = input.value;
    }
  },

  registerEventHandlers: function () {
    Data.ui.topMenu_clipboard.on('click', $.proxy(UI.tabClick, null, 'clipboard'));
    Data.ui.topMenu_logs.on('click', $.proxy(UI.tabClick, null, 'logs'));
    Data.ui.bottomMenu_menu.on('click', $.proxy(UIPanels.showMenuPanel, null, false));
    UI.update_scrollables();
  },

  update_scrollables: function() {
    Data.ui.clipboard_list.slimScroll({height: 'auto', color: '#ffcc2a', alwaysVisible: true});
    Data.ui.logs_list.slimScroll({height: 'auto', color: '#ffcc2a', alwaysVisible: true});
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
      "Overheating guns",
      "Bumping the titan",
      "Fitting a windicator",
      "Burning point",
      "Posting gudfites",
      "Z0r",
      "Whoring on the pod"
    ];
    return msgs[Math.floor(Math.random()*msgs.length)] + "...";
  }
}

Handlebars.registerHelper('ui_icon', function(icon) {
  if (icon == 'alert') return 'bell';
  if (icon == 'approve') return 'check';
  if (icon == 'close') return 'close';
  if (icon == 'deny') return 'thumbs-down';
  if (icon == 'dscan') return 'wifi';
  if (icon == 'error') return 'exclamation-triangle';
  if (icon == 'fleet') return 'fighter-jet';
  if (icon == 'fleetCreated') return 'fighter-jet';
  if (icon == 'hostileTimeout') return 'clock-o';
  if (icon == 'info') return 'question';
  if (icon == 'member') return 'user';
  if (icon == 'memberJoined') return 'user';
  if (icon == 'memberLeft') return 'user';
  if (icon == 'memberTimedOut') return 'clock-o';
  if (icon == 'options') return 'cog';
  if (icon == 'reportClear') return 'check';
  if (icon == 'reportHostile') return 'crosshairs';
  if (icon == 'scan') return 'wifi';
  if (icon == 'scanPosted') return 'wifi';
  if (icon == 'settings') return 'cog';
  if (icon == 'shipLost') return 'bolt';
  if (icon == 'sourcedClear') return 'check';
  if (icon == 'sourcedClipboard') return 'clipboard';
  if (icon == 'sourcedHostile') return 'crosshairs';
  if (icon == 'updateHostile') return 'crosshairs';
  if (icon == 'updateSystemMap') return 'sitemap';
  if (icon == 'youJoined') return 'user';

  return 'exclamation';
});

Handlebars.registerHelper('reported', function(pilots) {
  if (Object.keys(pilots).length > 1) {
    return Object.keys(pilots).length + ' hostiles ';
  } else {
    return Object.keys(pilots)[0];
  }
});

Handlebars.registerHelper("debug", function(optionalValue) {
  console.log("Current Context");
  console.log("====================");
  console.log(this);
 
  if (optionalValue) {
    console.log("Value");
    console.log("====================");
    console.log(optionalValue);
  }
});
