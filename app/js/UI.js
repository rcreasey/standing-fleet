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
  
  toggle: function(element) {
    element.toggle();
  },
  
  toggleHelp: function() {
    if ($('.menu-button.active').attr('id') === Data.ui.topMenu_map.attr('id')) {
      Data.ui.mapLegend.hide();
      var help = $(Data.templates.map_legend());
      help.find('span').text( Data.systems[ Data.state.self.systemId ].name );
      Data.ui.mapLegend.html( help );
      Data.ui.mapLegend.fadeIn(Data.config.uiSpeed)
        .delay(Data.config.alertStay)
        .fadeOut(Data.config.uiSpeed * 5);
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
  
  startSpin: function () {
    Data.ui.bottomMenu_spinner
      .fadeIn(Data.config.uiSpeed*4);
  },

  stopSpin: function () {
    Data.ui.bottomMenu_spinner
      .fadeOut(Data.config.uiSpeed*4);
  },

  unlink: function() { window.location = "/unlink"; },
  logout: function() { window.location = "/logout"; },

  registerEventHandlers: function () {
    
    Data.ui.topMenu_hud.on('click', $.proxy(UI.tabClick, null, "hud"));
    Data.ui.topMenu_map.on('click', $.proxy(UI.tabClick, null, "system-map"));
    Data.ui.topMenu_hostiles.on('click', $.proxy(UI.tabClick, null, "hostiles"));
    Data.ui.topMenu_members.on('click', $.proxy(UI.tabClick, null, "members"));
    Data.ui.topMenu_events.on('click', $.proxy(UI.tabClick, null, "events"));
    Data.ui.topMenu_scans.on('click', $.proxy(UI.tabClick, null, "scans"));

    Data.ui.bottomMenu_local.on('click', $.proxy(UIPanels.showStatusPanel, null, false));
    Data.ui.bottomMenu_scan.on('click', $.proxy(UIPanels.showScanPanel, null, false));
    Data.ui.bottomMenu_unlink.on('click', $.proxy(UI.unlink, null, false));
    Data.ui.bottomMenu_help.on('click', $.proxy(UI.toggleHelp, null));
    Data.ui.bottomMenu_menu.on('click', $.proxy(UIPanels.showMenuPanel, null, false));

    Data.ui.statusClear.on('click', $.proxy(UI.submitStatusClear, null));
    Data.ui.statusHostile.on('click', $.proxy(UIPanels.showStatusPanel, null, false));

    UI.update_scrollables();
  },

  update_scrollables: function() {
    Data.ui.hostiles_list.slimScroll({height: 'auto',  color: '#ffcc2a', alwaysVisible: true});
    Data.ui.members_list.slimScroll({height: 'auto',  color: '#ffcc2a', alwaysVisible: true});
    Data.ui.scans_list.slimScroll({height: 'auto',  color: '#ffcc2a', alwaysVisible: true});
    Data.ui.events_list.slimScroll({height: 'auto',  color: '#ffcc2a', alwaysVisible: true});
    Data.ui.fleet_list.slimScroll({height: 'auto',  color: '#ffcc2a', alwaysVisible: true});
  },

  submitStatusClear: function() {
    submitStatus('clear', Data.state.self.characterName);
  },

  showAlert: function (event) {
    if ($('.menu-button.active').attr('id') === Data.ui.topMenu_hud.attr('id')) return;
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
};

Handlebars.registerHelper('hud_detect_hostiles', function(status) {
  if (status == 'warning') return true;
  else return false;
});

Handlebars.registerHelper('format_ts', function(ts) {
  return moment(ts).format('MM/DD HH:mm:ss');s
});

Handlebars.registerHelper('ui_icon', function(icon) {
  if (icon == 'addAdvisory') return 'bolt';
  if (icon == 'alert') return 'bell';
  if (icon == 'approve') return 'check';
  if (icon == 'close') return 'close';
  if (icon == 'deny') return 'thumbs-down';
  if (icon == 'dscan') return 'wifi';
  if (icon == 'error') return 'exclamation-triangle';
  if (icon == 'fleet') return 'fighter-jet';
  if (icon == 'fleetCreated') return 'fighter-jet';
  if (icon == 'hostileFaded') return 'eye-slash';
  if (icon == 'hostileTimeout') return 'clock-o';
  if (icon == 'info') return 'question';
  if (icon == 'member') return 'user';
  if (icon == 'memberJoined') return 'user';
  if (icon == 'memberLeft') return 'user';
  if (icon == 'memberTimedOut') return 'clock-o';
  if (icon == 'options') return 'cog';
  if (icon == 'reportClear') return 'check';
  if (icon == 'reportHostile') return 'crosshairs';
  if (icon == 'clearAdvisory') return 'check';
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
  
  if (icon == 'Wormhole Detected') return 'chevron-circle-right'; 
  if (icon == 'Hostile Cloaked') return 'cloud'; 
  if (icon == 'Hostile Faded') return 'clock-o'; 
  if (icon == 'Hostile Logged Off') return 'sign-out'; 
  if (icon == 'Undock Camped') return 'lock'; 
  if (icon == 'Gate Bubbled') return 'dot-circle-o';  

  return 'exclamation';
});
