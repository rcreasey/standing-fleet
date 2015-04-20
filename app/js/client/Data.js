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
          "branch.imperium": false,
          "cache.imperium": false,
          "catch.imperium": false,
          "cr.imperium": false,
          "cobalt.imperium": false,
          "curse.imperium": false,
          "deklein.imperium": true,
          "delve.imperium": false,
          "detorid.imperium": false,
          "esoteria.imperium": false,
          "etherium.imperium": false,
          "fade.imperium": false,
          "feythabolis.imperium": false,
          "fountain.imperium": false,
          "geminate.imperium": false,
          "gw.imperium": false,
          "immensea.imperium": false,
          "impass.imperium": false,
          "insmother.imperium": false,
          "kalevala.imperium": false,
          "malpais.imperium": false,
          "oasa.imperium": false,
          "omist.imperium": false,
          "op.imperium": false,
          "or.imperium": false,
          "paragon.imperium": false,
          "period.imperium": false,
          "perrigen.imperium": false,
          "providance.imperium": false,
          "pb.imperium": false,
          "querious.imperium": false,
          "scalding.imperium": false,
          "spire.imperium": false,
          "stain.imperium": false,
          "syndicate.imperium": false,
          "tenal.imperium": false,
          "tenerifis.imperium": false,
          "tribute.imperium": false,
          "vale.imperium": false,
          "venal.imperium": false,
          "wicked.imperium": false,
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
