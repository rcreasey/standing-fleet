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
  },

  submitStatusClear: function() {
    submitStatus('clear', Data.state.self.characterName);
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
  if (icon == 'settings') return 'cog'
  return 'question'
});
