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

  fadeIn: function(element) {
    element.fadeIn(Data.config.uiSpeed);
  },

  fadeOut: function(element) {
    element.fadeOut(Data.config.uiSpeed);
  },
  
  toggle: function(element) {
    element.fadeIn(Data.config.uiSpeed)
      .delay(Data.config.alertStay)
      .fadeOut(Data.config.uiSpeed * 5);
  },

  toggleHelp: function() {
    if ($('.menu-button.active').attr('id') === Data.ui.topMenu_map.attr('id')) {
      Data.ui.mapLegend.hide();
      var help = $(Data.templates.map_legend());
      help.find('span').text( Data.state.vicinity.systemName );
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
  
  blinkHud: function() {
    Data.ui.hud.find('.screen').pulse({times: 20, duration: Data.config.uiSpeed});
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
    
    Data.ui.pilot_key_toggle.hover($.proxy(UI.fadeIn, null, Data.ui.pilot_key),
                                   $.proxy(UI.fadeOut, null, Data.ui.pilot_key));
                                   
    Data.ui.region_lookup_toggle.on('click', $.proxy(UI.regionLookup, null, false));
    Data.ui.mapReset.on('click', $.proxy(SystemMap.resetRegion, null, false));
    
    UI.update_scrollables();
  },

  update_scrollables: function() {
    Data.ui.hostiles_table.slimScroll({height: 'auto',  color: '#ffcc2a', alwaysVisible: true});
    Data.ui.members_table.slimScroll({height: 'auto',  color: '#ffcc2a', alwaysVisible: true});
    Data.ui.scans_list.slimScroll({height: 'auto',  color: '#ffcc2a', alwaysVisible: true});
    Data.ui.events_list.slimScroll({height: 'auto',  color: '#ffcc2a', alwaysVisible: true});
    // Data.ui.fleet_list.slimScroll({height: 'auto',  color: '#ffcc2a', alwaysVisible: true});
  },

  data_client_check: function() {
    if (Data.config.data_client.connected) {
      Data.ui.bottomMenu_dataClient_icon.addClass('fa-chain');
    } else {
      Data.ui.bottomMenu_dataClient.remove();
    }
  },

  submitStatusClear: function() {
    submitStatus('clear', Data.state.self.characterName);
  },
  
  regionLookup: function() {
    Server.regions(function(error, data) {

      Data.ui.region_lookup_search.typeahead({
        hint: false,
        highlight: true,
        minLength: 3
      },
      {
        source: UIPanels.substringMatcher($.map(data.regions, function(r) { return r.name; }))
      });
      
      Data.ui.region_lookup_search.focus().on('keydown', function (event) {
        if (event.keyCode == 13) {
          SystemMap.switchRegion();
          return false;
        }
      });  
      
      Data.ui.region_lookup.fadeIn(Data.config.uiSpeed)
        .delay(Data.config.alertStay * 2)
        .fadeOut(Data.config.uiSpeed * 5);

    });
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
      "Clicking jump instead of bridge",
      "Overheating guns",
      "Bumping the titan",
      "Fitting a windicator",
      "Burning point",
      "Posting gudfites",
      "o7 m8 m8 m8",
      "7o 8m 8m 8m",
      "HAT GONS",
      "Gevlon Goblin will rule the world",
      "Z0r",
      "Whoring on the pod"
    ];
    return msgs[Math.floor(Math.random()*msgs.length)] + "...";
  },

  mapUnicode: function(system_id, list) {
    if (list === undefined) {
      return (HostileList.fadedCount(system_id) > 0) ? '\uf017' : "";
    }
    if (list.length === 0) return "";

    return $.map(list, function(a) {
      if (a == 'Wormhole Detected') return '\uf138';
      else if (a == 'Hostile Cloaked') return '\uf070';
      else if (a == 'Hostile Faded') return '\uf017';
      else if (a == 'Hostile Logged Off') return '\uf08b';
      else if (a == 'Undock Camped') return '\uf023';
      else if (a == 'Gate Bubbled') return '\uf192';
      else if (a == 'Hostile') return '\uf0fb';
      else return '';

    }).join("");
  },

  hud_status_text: function(status) {
    var cl = '<i class="fa fa-chevron-left"></i>';
    var cr = '<i class="fa fa-chevron-right"></i>';

    if (status == 'clear') return 'clear';
    else if (status == 'warning') return cr + ' warning ' + cl;
    else if (status == 'hostile') return cr + cr + ' alert ' + cl + cl;
    else return 'unknown';
  }
};

Handlebars.logger.level = 0;

Handlebars.registerHelper('hud_status_text', UI.hud_status_text);

Handlebars.registerHelper('hud_neighbor_status', function(id, name) {
  var status = SystemMap.system_color({id: id, name: name});

  if (status == 'clear') return 'check-circle';
  else if (status == 'warning') return 'exclamation-triangle';
  else if (status == 'hostile') return 'crosshairs fa-spin';
  else return 'question-circle';
});

Handlebars.registerHelper('format_ts', function(ts) {
  return moment.unix(ts).utc().format('MM/DD HH:mm:ss');
});

Handlebars.registerHelper('format_ts_short', function(ts) {
  return moment.unix(ts).utc().format('HH:mm:ss');
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
  if (icon == 'hostileFaded') return 'clock-o';
  if (icon == 'hostileTimeout') return 'clock-o';
  if (icon == 'info') return 'info-circle';
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
  if (icon == 'traversal') return 'bus';
  if (icon == 'updateHostile') return 'crosshairs';
  if (icon == 'updateSystemMap') return 'sitemap';
  if (icon == 'wormhole') return 'chevron-circle-right';
  if (icon == 'youJoined') return 'user';

  if (icon == 'Wormhole Detected') return 'chevron-circle-right';
  if (icon == 'Hostile Cloaked') return 'eye-slash';
  if (icon == 'Hostile Faded') return 'clock-o';
  if (icon == 'Hostile Logged Off') return 'sign-out';
  if (icon == 'Undock Camped') return 'lock';
  if (icon == 'Gate Bubbled') return 'dot-circle-o';

  return 'exclamation';
});

Handlebars.registerHelper('add_commas', function(number) {
  return (number + '').replace(/(\d)(?=(\d{3})+$)/g, '$1,')
});

Handlebars.registerHelper('jump_permitted_ships', function(mass) {
  var ships = [];
  
  if (mass >= 1000000) ships.push('frigate');
  if (mass >= 1200000) ships.push('destroyer');
  if (mass >= 12000000) ships.push('cruiser');
  if (mass >= 13000000) ships.push('battlecruiser');
  if (mass >= 40000000) ships.push('mining-barge');
  if (mass >= 12500000) ships.push('industrial');
  if (mass >= 100000000) ships.push('battleship');
  if (mass >= 250000000) ships.push('industrial-command');
  if (mass >= 1200000000) ships.push('carrier');
  if (mass >= 1200000000) ships.push('dreadnought');
  
  return ships;
});

$.fn.pulse = function(options) {
  
  var options = $.extend({
    times: 3,
    duration: 1000
  }, options);
  
  var period = function(callback) {
    $(this).animate({opacity: 0.5}, options.duration, function() {
      $(this).animate({opacity: 1}, options.duration, callback);
    });
  };
  return this.each(function() {
    var i = +options.times, self = this,
    repeat = function() { --i && period.call(self, repeat) };
    period.call(this, repeat);
  });
};
