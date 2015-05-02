var path = require('path');

var Data = {
  config: {
    domain: 'https://standing-fleet.apps.goonswarm.org/',
    apiUrl: '/api/fleet',
    alertStay: 5000,
    maxEvents: 20,
    uiSpeed: 400,
    local_dataport: 44444,
    log: 'console'
  },

  state: {
    alertCount: 0,
    dimmed: false,
    poll: {
      loop: 15000,
      clipboard: false,
      logs: true
    },
    datasources: {
      local: null,
      logs: {
        handles: [],
        path: {
          win: path.join(process.env['USERPROFILE'] || '','Documents','EVE','logs','Chatlogs'),
          darwin: path.join(process.env['HOME'] || '','Library','Application Support','EVE Online','p_drive','User','My Documents','EVE','logs','Chatlogs')
        },
        channels: {
          "dek.imperium": true,
          "brn.imperium": false,
          "tnl.imperium": false,
          "tri.imperium": false,
          "vale.imperium": false,
          "vnl.imperium": false,
          "fade.imperium": false,
          "ce.imperium": false,
          "ftn.imperium": false,
          "gem.imperium": false,
          "cr.imperium": false,
          "provi.imperium": false,
          "synd.imperium": false,
          "ec_gate.imperium": false,
          "mo_gate.imperium": false,
          "p3_gate.imperium": false
        }
      }
    }
  },

  build_ui: function() {
    return {
      logo: $('#top-logo'),
      alertContainer: $('#alert-container'),
      contentWrapper: $('#content-wrapper'),
      dim: $('#dim'),

      topMenu: $('#top-menu'),
      topMenu_clipboard: $('#top-menu-clipboard'),
      topMenu_logs: $('#top-menu-logs'),

      bottomMenu: $('#bottom-menu'),
      bottomMenu_spinner: $('#bottom-menu-spinner'),
      bottomMenu_menu: $('#bottom-menu-menu'),

      clipboard: $('#clipboard'),
      clipboard_list: $('#clipboard > .list'),
      logs: $('#logs'),
      logs_list: $('#logs > .list')
    };
  },

  build_templates: function() {
    return {
      alert: Templates.alert,
      event: Templates.event,
      report: Templates.report,
      panel: Templates.panel
    };
  }
};
