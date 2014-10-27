var gui = require('nw.gui')
  , http = require('http')
  , faye = require('faye')
  , moment = require('moment')
  , fs = require('fs')
  , path = require('path')
  , tail = require('file-tail')
  , etree = require('elementtree')
  , https = require('https')
  
window.onload = function () {
  initializeClient();
};

window.onresize = function() {
  UI.update_scrollables();
};

function initializeClient() {
  log('Client Init...');
  Data.ui = Data.build_ui();
  Data.templates = Data.build_templates();

  log('Starting Server...')
  var server = http.createServer()
  Data.state.datasources.local = new faye.NodeAdapter({mount: '/', timeout: 45});

  Data.state.datasources.local.attach(server);
  server.listen(Data.config.local_dataport);

  UI.stopSpin();
  UI.registerEventHandlers();
  UI.unDim();

  log('Begin Polling...')
  pollClipboard();
  pollLogs();
  
  gui.Window.get().show();
};

function pollClipboard() {
  UI.startSpin();
  setTimeout(function() {
    if (Data.state.poll.clipboard) {
      var cb = gui.Clipboard.get();
      var clipboard = document.getElementById('clipboard')
      var event = {'time': Util.getTime(), 'type': 'sourcedClipboard', 'text': cb.get('text')};

      var renderedEvent = $(Templates.event(event))
      Data.ui.clipboard_list.prepend(renderedEvent);
      Data.state.datasources.local.getClient().publish('/events', event);

      UI.stopSpin();
    }

    pollClipboard();

  }, Data.state.poll.loop);
};

function pollLogs() {
  if (!Data.state.poll.logs) return;
  
  var log_dir = (/^win/.test(process.platform)) ? Data.state.datasources.logs.path.win : Data.state.datasources.logs.path.darwin;
  var channels = [];
  
  for (channel in Data.state.datasources.logs.channels) {
    if (Data.state.datasources.logs.channels[channel]) channels.push(channel)
  }
  
  if (!channels.length) {
    log('No logs to parse')
    return;
  }
  
  var filename_match = '(' + channels.join('|') + ')_';
  // filename_match += moment.format('YYYYMMDD');
  filename_match += '20130627';
  filename_match += '_\\d+.txt';

  fs.readdir(log_dir, function(err, list) {
    if(err) throw err;
    var regex = new RegExp(filename_match);
    list.forEach( function(file) {
      if (regex.test(file)) {
        log('Watching ' + file);
        t = new tail.startTailing(path.join(log_dir, file))
        t.on('line', processLogLine);

        Data.state.datasources.logs.handles.push( t );
      }
    }); 
  });
};

var processLogLine = function processLogLine(line) {
  processLine(line, function(event) {
    if (!event) return;

    var renderedEvent = $(Templates.report(event))
    Data.ui.logs_list.prepend(renderedEvent);
    Data.state.datasources.local.getClient().publish('/events', event);
  });
}

function resetLogPolling() {
  log('Clearing log handles...')
  while (Data.state.datasources.logs.handles.length) {
    var handle = Data.state.datasources.logs.handles.pop();
    handle.stop();
    delete handle;
  }

  pollLogs();
};

function log(message) {
  if (!Data.config.log) return;
  
  if (Data.config.log === 'events') {
    EventList.addEvent({
      type: 'info',
      text: message
    });

  } else if (Data.config.log === 'console') {
    console.log('[' + moment().unix() + '] - ' + message)
  }
};

var Dict = function() {
  "use strict";
  this._root = {};
};
 
Dict.prototype = {
  /**
   * @param {string} word
   */
  add: function add(word) {
    var i, char, node = this._root, uword;
    if( !(typeof word === 'string' || word instanceof String) ) {
      throw new TypeError("word is not string");
    }
    uword = word.toUpperCase();
    // Assert start position with a space character
    node = node[" "] || (node[" "] = {_parent: node});
    for( i = 0 ; i < uword.length; i++ ) {
      char = uword.charAt(i);
      node = node[char] || (node[char] = {_parent: node});
    }
    node._result = word;
  },
  compile: function compile() {
    var queue = [], entry, node, child, fall;
 
    queue.push(this._root);
    while( queue.length > 0 ) {
      node = queue.shift();
      delete node._fall;
      var keys = Object.keys(node);
      for( var i = 0 ; i < keys.length; i++ ) {
        var key = keys[i];
        if(key.length > 1) {
          continue;
        }
        queue.push(node[key]);
      }
    }
 
    this._root._fall = this._root;
    queue.push({char: null, node: this._root});
    while( queue.length > 0 ) {
      entry = queue.shift();
      node = entry.node;
      var keys = Object.keys(node);
      for( var i = 0 ; i < keys.length; i++ ) {
        var key = keys[i];
        if(key.length > 1) {
          continue;
        }
        var char = key;
        child = node[key];
        queue.push({char: char, node: child});
      }
      if( node === this._root ) {
        continue;
      }
      fall = node._parent._fall;
      while( fall[entry.char] === undefined && fall !== this._root ) {
        fall = fall._fall;
      }
      node._fall = fall[entry.char] || this._root;
      if( node._fall === node ) {
        node._fall = this._root;
      }
    }
  },
  search: function search(text) {
    var result = [], state = this._root, node, i, self=this;
    if( !(typeof text === 'string' || text instanceof String) ) {
      throw new TypeError("word is not string");
    }
    text = text.toUpperCase();
    var step = function search_step(char) {
      node = state;
      while( node[char] === undefined && node !== self._root ) {
        node = node._fall;
      }
      if( node === self._root ) {
        node = node[char] || self._root;
      }
      else {
        node = node[char];
      }
      state = node;
      while( node !== self._root ) {
        if( node._result ) {
          result.push(node._result);
        }
        node = node._fall;
      }
    };
    step(" ");
    for( i = 0 ; i < text.length ; i++ ) {
      step(text.charAt(i));
    }
    return result;
  }
};

var getCharIDs = function getCharIDs(characterList, next) {
  https.get('https://api.eveonline.com/Eve/CharacterID.xml.aspx?names=' + characterList.join(","), function(response){
    var result = '';
    response.on('data', function(chunk){result += chunk;});
    response.on('end', function() {
      var xml = etree.parse(result);
      xml.findall('./result/rowset/row').map(function(row) {
        if( characters[row.attrib.name.toUpperCase()] !== undefined ) {
          return;
        }
        var charID = parseInt(row.attrib.characterID);
        if( charID !== 0 ){
          characters[row.attrib.name.toUpperCase()] = charID;
          charDict.add(row.attrib.name);
        }
        else {
          characters[row.attrib.name.toUpperCase()] = null;
        }
      });
      charDict.compile();
      next();
    });
  });
};

var systems = ["006-L3","00GD-D","00TY-J","01B-88","01TG-J","02V-BK","03-OR2","0-3VW8","04-EHC","04EI-U","04-LQM","0-4VQL","05R-7A","06-70G","0-6VZ5","07-SLO","0-7XA8","08-N7Q","08S-39","08Z-JJ","0-9UHT","0A-KZ0","0-ARFO","0-BFTQ","0B-HLZ","0B-VOJ","0D-CHA","0DD-MH","0EK-NJ","0FG-KS","0-G8NO","0G-A25","0GN-VO","0-GZX9","0-HDC8","0IF-26","0J3L-V","0J-MQW","0LTQ-C","0LY-W1","0M-103","0M-24X","0MV-4W","0-MX34","0-N1BJ","0N-3RO","0-NTIS","0NV-YU","0-O2UT","0-O6XF","0OTX-J","0OYZ-G","0P9Z-I","0P-F3K","0PI4-E","0P-U0Q","0PU2-R","0-QP56","0-R5TS","0R-F2F","0R-GZQ","0RI-OV","0S1-GI","0SHT-A","0SUF-3","0T-AMZ","0TKF-6","0T-LIB","0-TRV1","0TYR-T","0-U2M4","0UBC-R","0-UVHJ","0V0R-R","0-VG7A","0VK-43","0-W778","0-WT2D","0-WVQS","0-XIDJ","0XN-SK","0Y1-M7","0-YMBJ","0ZN7-G","10UZ-P","1-10QG","111-F1","1-1I53","1-2J4P","12YA-2","13-49W","1-3HWZ","14YI-D","1-5GBW","15U-JY","15W-GC","168-6H","16AM-3","16P-PX","1-7B6D","1-7HVI","1-7KWU","18-GZM","18XA-C","1A8-6G","1ACJ-6","1-BK1Q","1B-VKF","1BWK-S","1C-953","1DDR-X","1DH-SX","1DQ1-A","1EO-OE","1-EVAX","1E-W5I","1-GBBP","1-GBVE","1GH-48","1G-MJE","1GT-MA","1H4V-O","1H5-3W","1-HDQ4","1H-I12","1I5-0V","1I6F-9","1IX-C0","1KAW-T","1-KCSA","1L-AED","1L-BHT","1L-OEK","1M4-FK","1M7-RK","1N-FJ8","1-NJLK","1-NKVT","1-NW2G","1NZV-7","1PF-BC","1-PGSG","1P-QWR","1P-WGB","1QH-0K","1QZ-Y9","1-SMEB","1S-SU1","1TG7-W","1VK-6B","1V-LI2","1W-0KS","1-Y6KI","1ZF-PJ","21M1-B","2-2EWC","23G-XC","23M-PX","2-3Q2G","24I-FE","25S-6P","2-6TGQ","27-HP0","2-84WC","28O-JY","28-QWU","28Y9-P","29YH-V","2-9Z6V","2AUL-X","2B-3M4","2B7A-3","2B-UUQ","2CG-5V","2D-0SO","2DWM-2","2EV-BA","2E-ZR5","2-F3OE","2FL-5W","2G38-I","2G-VDP","2H-TSE","2I-520","2IBE-N","2ID-87","2IGP-1","2ISU-Y","2JJ-0E","2JT-3Q","2J-WJY","2-KF56","2-KPW6","2O9G-D","2O-EEW","2P-4LS","2PG-KN","2PLH-3","2-Q4YG","2Q-I6Q","2R-CRW","2R-KLH","2-RSC7","2-TEGJ","2TH-3F","2UK4-N","2ULC-J","2-V0KY","2V-CS5","2V-ZHM","2-WNTD","2WU-XT","2-X0PF","2X7Z-L","2XI8-Y","2X-PQG","2-YO2K","2Z-HPQ","30-D5G","3-0FYP","30-YOU","313I-B","319-3D","31-MLU","31X-RE","32-GI9","33CE-7","3-3EZB","33FN-P","33-JRO","33RB-O","35-JWD","35-RK9","36N-HZ","373Z-7","37S-KO","384-IN","38IA-E","38NZ-1","39-DGG","39P-1J","3A1P-N","3AE-CP","3-BADZ","3BK-O7","3D5K-R","3D-CQU","3-DMQT","3DR-CR","3ET-G8","3F-JZF","3-FKCZ","3FKU-H","3GD6-8","3G-LFX","3G-LHB","3GXF-U","3H58-R","3HQC-6","3HX-DL","3IK-7O","3-IN0V","3-JCJT","3-JG3X","3JN9-Q","3KB-J0","3KNA-N","3KNK-A","3L3N-X","3-LJW3","3LL-O0","3L-Y9M","3MOG-V","3-N3OO","3OAT-Q","3-OKDA","3OP-3E","3PPT-9","3Q1T-O","3QE-9Q","3-QNM4","3Q-VZA","3-QYVE","3S-6VU","3SFU-S","3-SFWG","3T7-M8","3-TD6L","3U-48K","3-UCBF","3USX-F","3V8-LJ","3VL6-I","3WE-KY","3-YX2D","3ZTV-V","4-07MU","40GX-P","4-1ECP","42G-OB","42SU-L","42-UOW","4-2UXV","42XJ-N","430-BE","43-1TL","43B-O1","442-CS","4-43BW","4-48K1","450I-W","46DP-O","4-7IL9","47L-J4","48I1-X","49-0LI","49GC-R","49-U6U","49V-E4","4A-6NI","4-ABS8","4A-XJ6","4AZ-J8","4AZV-W","4-BE0M","4B-NQN","4C-B7X","4CJ-AC","4-CM8I","4-CUM5","4D9-66","4DH-ST","4DS-OI","4DTQ-K","4DV-1T","4E-EZS","4-EFLU","4-EP12","4F6-VZ","4F89-U","4F9Y-3","4-GB14","4-GJT1","4GQ-XQ","4GSZ-1","4GYV-Q","4HF-4R","4HS-CR","4-HWWF","4H-YJZ","4-IT9G","4J9-DK","4-JWWQ","4J-ZC9","4K0N-J","4K-TRB","4LB-EL","4L-E5P","4LJ6-Q","4LNE-M","4-M1TY","4M-HGL","4M-P1I","4-MPSJ","4M-QXK","4NBN-9","4N-BUI","4NDT-W","4NGK-F","4O-239","4OIV-X","4-OS2A","4-OUKF","4O-ZRI","4-P4FE","4-PCHD","4-QDIX","4QY-NT","4RS-L1","4RX-EE","4S0-NP","4S-PVC","4T-VDE","4U90-Z","4VY-Y1","4X0-8B","4XW2-D","4Y-OBL","4YO-QK","504Z-V","5-0WB9","51-5XG","52CW-6","52G-NZ","5-2PQU","52V6-B","5-3722","54-MF6","56D-TC","5-6QW7","5-75MB","57-KJB","57M7-W","57-YRU","58Z-IH","5-9L3H","5-9UXZ","5-9WNU","5-A0PX","5AQ-5H","5BTK-M","5B-YDD","5-CQDA","5C-RPA","5-CSE3","5-D82P","5DE-QS","5-DSFH","5E6I-W","5E-CMA","5ED-4E","5E-EZC","5ELE-A","5E-VR8","5FCV-A","5-FGQI","5F-MG1","5F-YRA","5GQ-S9","5HN-D6","5H-SM2","5-IH57","5IH-GL","5IO8-U","5-IZGE","5J4K-9","5J-62N","5JEZ-I","5J-UEX","5KG-PY","5KS-AB","5LAJ-8","5-LCI7","5LJ-MD","5M2-KP","5-MLDT","5-MQQ7","5-N2EY","5NQI-E","5-NZNW","5-O8B1","5OJ-G2","5-P1Y2","5P-AIP","5Q65-4","5S-KNL","5S-KXA","5-T0PZ","5T-A3D","5T-KM3","5-U12M","5U-3PW","5V-BJI","5-VFC6","5-VKCN","5V-Q1R","5W3-DG","5WAE-M","5XR-KZ","5ZO-NZ","5ZU-VG","5ZXX-K","60M-TG","617I-I","6-1T6Z","62O-UE","63-7Q6","6-4V20","65V-RH","669-IX","66-PMM","66U-1P","671-ST","67Y-NR","68FT-6","6-8QLA","6A-FUY","6-AOLS","6B-GKA","6BJH-3","6BPS-T","6-CZ49","6E-578","6EG7-R","6EK-BV","6-ELQP","6E-MOW","6-EQYE","6F-H3W","6FS-CZ","6-GRN7","6GWE-A","6-I162","6-IAFR","6-K738","6-KPAB","6-L4YC","6L78-1","6-MM99","6NJ8-V","6-O5GY","6ON-RW","6-OQJV","6OU9-U","6O-XIO","6OYQ-Z","6Q4-X6","6QBH-S","6Q-R50","6RCQ-V","6R-PWU","6RQ9-A","6SB-BN","6T3I-L","6-TYRX","6U-1RX","6-U2M8","6U-MFQ","6UQ-4U","6UT-1K","6V-D0E","6VDT-H","6W-6O9","6W-HRH","6-WMKE","6WT-BE","6WW-28","6X7-JO","6Y-0TW","6YC-TU","6Y-WRK","6Z9-0M","6Z-CKS","6ZJ-SC","71-UTX","7-2Z93","73-JQO","74-DRC","74L2-U","74-VZA","75C-WN","75FA-Z","7-692B","77-KDQ","77S8-E","78-0R6","7-8EOE","78R-PI","7-8S5X","78TS-Q","7-A6XV","7AH-SF","7BIX-A","7BX-6F","7D-0SQ","7D-PAT","7EX-14","7F-2FB","7GCD-P","7G-H7D","7G-QIG","7-IDWY","7JF-0Z","7JRA-G","7-JT09","7-K5EL","7-K6UE","7KIK-H","7K-NSE","7L3-JS","7L9-ZC","7LHB-Z","7M4-4C","7M4C-F","7MD-S1","7MMJ-3","7-P1JO","7P-J38","7-PO3P","7Q-8Z2","7-QOYS","7R5-7R","7RM-N0","7T-0QS","7T6P-C","7-UH4Z","7UTB-F","7-UVMT","7V-KHW","7X-02R","7-X3RN","7X-VKB","7-YHRX","7YSF-E","7YWV-S","7-ZT1Y","80G-H5","8-2JZA","83-YGI","8-4GQM","8-4KME","85-B52","863P-X","86L-9F","87-1PM","87XQ-0","88A-RA","89-JPE","89JS-J","8-AA98","8AB-Q4","8B-2YA","8B-A4E","8-BEW8","8-BIE3","8B-SAJ","8B-VLX","8CIX-S","8CN-CH","8C-VE3","8DL-CP","8EF-58","8ESL-G","8FN-GP","8F-TK3","8G-2FP","8-GE2P","8G-MQV","8-JYPM","8KE-YS","8K-QCZ","8KQR-O","8KR9-5","8-KZXQ","8MG-J6","8-MXHA","8O-OSG","8OYE-Z","8-OZU1","8P9-BM","8P-LKL","8QMO-E","8Q-T7B","8QT-H4","8Q-UYU","8RL-OG","8RQJ-2","8R-RTB","8S-0E1","8S28-3","8-SNUD","8-SPNN","8-TFDX","8TPX-N","8-VC6H","8V-SJJ","8WA-Z6","8W-OSE","8-WYQZ","8X6T-8","8YC-AN","8-YNBE","8ZO-CK","9-02G0","90-A1P","9-0QB7","91-KD8","9-266Q","92-B0X","92D-OI","92K-H2","9-34L5","93PI-4","94FR-S","94-H3F","9-4RP2","972C-1","97-M96","9-7SRQ","97X-CH","9-8BL8","9-8GBA","98Q-8O","99-0GS","995-3G","9-980U","9-B1DS","9BC-EB","9CG6-H","9CK-KZ","9D6O-M","9DQW-W","9ES-SI","9-EXU9","9-F0B2","9F-3CR","9F-7PZ","9F-ERQ","9G5J-1","9-GBPD","9GI-FB","9GNS-2","9GYL-O","9-HM04","9-IIBL","9IPC-E","9I-SRF","9IZ-HU","9KE-IT","9KOE-A","9-KWXC","9-MJVQ","9M-M0P","9MWZ-B","9N-0HF","9NI-FW","9O-8W1","9OLQ-6","9OO-LH","9O-ORX","9-OUGJ","9O-ZTS","9P4O-F","9P-870","9PX2-F","9QS5-C","9R4-EJ","9-R6GU","9RQ-L8","9SBB-9","9S-GPT","9SL-K9","9SNK-O","9T-APQ","9U6-SV","9U-TTJ","9UY4-H","9-VO0Q","9-WEMC","9WVY-F","9-XN3F","9-ZA4Z","9-ZFCG","9ZFH-Z","9Z-XJN","A-0IIQ","A0M-R8","A1-AUH","A1BK-A","A-1CON","A1F-22","A-1IJ9","A1RR-M","A24L-V","A2-V27","A2V6-6","A-3ES3","A3-LOG","A3-RQ3","A4B-V5","A-4JOO","A4L-A2","A4UG-O","A-5F4A","A-5M31","A5MT-B","A-7XFN","A-803L","A-80UA","A8A-JN","A8I-C5","A8-XBW","A9D-R0","A9-F18","A-AFGR","AA-GWF","Aakari","AAM-1A","AAS-8R","AA-YRK","Abagawa","Abai","Abaim","Aband","Abath","ABE-M2","Abenync","AB-FZE","Abha","Abhan","A-BO4V","Abrat","Abudban","Abune","AC2E-3","A-C5TC","AC-7LZ","Access","A-CJGE","Aclan","Actee","AD-5B8","Adacyne","Adahum","Adallier","Adar","AD-CBT","A-DDGY","Adeel","Aderkan","Adia","Adiere","Adirain","Adrallezoen","Adrel","Adreland","A-DZA8","Aedald","Aeddin","Aeditide","A-ELE2","Aere","Aeschee","Aeter","Aetree","AF0-V5","Afivad","AFJ-NB","Afnakat","Afrah","A-G1FM","Agal","Agaullores","AGCP-I","AGG-NR","Agha","Aghesi","Agil","Agoze","A-GPTM","Agrallarier","AG-SYG","Agtver","AH8-Q7","Ahala","Aharalel","AH-B84","Ahbazon","Ahkour","Ahmak","Ahraghen","Ahrosseas","Ahteer","Ahtila","Ahtulaima","Ahynada","A-HZYL","Aice","AID-9T","Aidart","AI-EVH","Aikantoh","Aikoro","Aimoguier","Ainaille","Ainsan","Airaken","Airkio","Airmia","Airshaz","Aivoli","Aivonen","A-J6SN","Ajanen","AJCJ-1","AJI-MA","Ajna","Akes","Akeva","Akhmoh","Akhrad","Akhragan","Akhwa","Akiainavas","Akidagi","Akila","Akkilen","Akkio","AK-L0Z","Akonoinen","Akora","Akpivem","AK-QBU","AL8-V4","Ala","Alachene","Alakgur","Alal","Alamel","ALC-JM","Aldagolf","Aldali","Aldik","Aldilur","Aldranette","Aldrat","Alenia","Alentene","Alf","Algasienan","Algogille","Aliette","Alikara","Alillere","AL-JSG","Alkabsi","Alkez","Allamotte","Allebin","Alles","Allipes","Alparena","Alperaute","Alra","Alsavoinon","Alsottobier","Altbrard","Altrinur","Amafi","Amamake","Amane","Amarr","Amasiree","Amattens","Ambeke","Amdonen","Ameinaka","Ami","Ammold","Amo","Amod","Amoderia","Amoen","Amphar","Amsen","Amygnon","Ana","Anara","Anath","Anbald","Anchauttes","Anckee","Andabiar","Andole","Andrub","Ane","AN-G54","Angatalie","Angur","Angymonne","Anher","Anila","Anin","Anjedin","Anka","Annad","Annages","Annancale","Annaro","Annelle","Anohel","Ansalle","Ansasos","Ansen","Ansher","Ansila","Ansone","Anstard","Antem","Antiainen","Antollare","Anttiri","Anyed","Anzalaisio","Aokannitoh","AOK-WQ","AO-N1P","AP9-LV","Apanake","APES-G","Aphend","Aphi","APM-6K","Aporulie","Appen","A-QRQT","AR-5SY","Arakor","Aralgrund","Aramachi","Aranir","Arant","Arasare","Arayar","Arbaz","ARBX-9","Archavoinet","Archee","Ardallabier","Ardar","Ardene","Arderonne","Ardhis","Ardishapur Prime","A-REKV","Arena","Arera","ARG-3R","Arifsdald","Aring","Arittant","Arkoz","Arlek","Arlulf","Armala","Arnatele","Arnher","Arnola","Arnon","Arnstur","Arodan","Arraron","Arshat","Artisine","Arton","Artoun","Arvasaras","Arveyil","Arwa","Arza","Arzad","Arzanni","Arzi","Arzieh","Asabona","Asakai","Asanot","Asesamy","Aset","Asezai","Asgeir","Asghatil","Asghed","Ashab","Ashi","Ashitsu","Ashkoo","Ashmarir","Ashokon","Asilem","A-SJ8X","Askonak","Asoutar","Asrios","Assah","Assez","Assiad","Assiettes","Astabih","Astoh","Atai","Atarli","Atgur","Athinard","Athounon","Atier","Ation","Atioth","A-TJ0G","Atlangeins","Atlanins","Atlar","Atlulle","Atonder","Atoosh","ATQ-QS","Atreen","Attyn","ATY-2U","AU2V-J","Aubenall","Auberulle","Aubonnie","Audaerne","Audesder","Aufay","Auga","Augnais","Aulbres","Aunenen","Auner","Aunia","Aunsou","Aurcel","Aurejet","Auren","Aurohunen","Ausmaert","Austraka","Autama","Autaris","Auvergne","Auviken","Avada","Avair","Avaux","Avele","Avenod","Averon","Avesber","A-VILQ","AV-VB6","Avyuh","AW1-2I","A-XASO","AX-DOT","AXDX-F","AY-24I","AY9X-Q","A-YB15","Aydoteaux","Ayeroilen","Aymaerne","AY-YCU","AZ3F-N","AZA-QE","AZBR-2","Azedi","Azer","Azerakish","AZF-GH","Azhgabid","Azizora","A-ZLHX","AZN-D2","AZ-UWB","B0C-LD","B17O-R","B1D-KU","B1UE-J","B-1UJC","B2J-5N","B-2UL0","B2-UQW","B-2VXB","B32-14","B-3QPD","B3QP-K","B3ZU-H","B-588R","B-5UFY","B6-52M","B-6STA","B6-XE8","B-7DFU","B-7LYC","B8EN-S","B8HU-Z","B8O-KJ","B-9C24","B9EA-G","B9E-H6","B9N2-2","B-A587","Babirmoult","Badivefi","Bagodan","Bahromab","Bairshir","Balanaz","Balas","Balginia","Balle","Bamiette","Bania","Bantish","Bapraya","Bar","Baratar","Barira","Barkrik","Barleguet","Barmalie","Basan","Basgerin","Bashakru","Bashyam","Baviasi","Bawilan","Bayuka","Bazadod","B-B0ME","BB-EKF","B-CZXG","B-DBYQ","BDV3-T","B-E3KQ","BEG-RL","Bei","Beke","Bekirdod","Bereye","Bersyrim","Berta","B-ETDW","BE-UUN","B-F1MI","BF-FVB","BF-SDP","B-G1LG","B-GC1T","BGMZ-0","BGN1-O","BG-W90","Bherdasopt","Bhizheba","BI0Y-X","B-II34","Bika","Bille","Bimener","Biphi","Bittanshal","BJD4-E","BJ-ZFD","BK4-YC","B-KDOZ","BKG-Q2","Blameston","BLC-X0","BLMX-B","BMNV-P","BMU-V1","BM-VYZ","BND-16","BNX-AS","BOE7-P","Bogelek","Boillair","Bomana","Bongveber","Boranai","Bordan","Bosboger","Bosena","Botane","Bourar","Bourynes","Boystin","BOZ1-O","BPK-XK","BQ0-UU","B-R5RB","BR-6XP","Brapelille","Brarel","Brellystier","Bridi","Brin","BR-N97","B-ROFP","BRT-OP","Brundakur","Brybier","B-S347","B-S42H","B-T6BT","BTLH-I","B-U299","Buftiar","BU-IU4","Bukah","Bundindus","Bushemal","BUZ-DB","BV-1JG","B-VFDD","B-VIP9","BVRQ-O","BWF-ZZ","BWI1-9","B-WPLZ","B-WQDP","BW-WJ2","BX2-ZX","B-XJX4","BX-VEX","BY5-V8","BY-7PY","BY-MSY","BY-S36","BYXF-Q","BZ-0GW","BZ-BCK","C-0ND2","C0O6-K","C0T-77","C1G-XC","C1-HAB","C1XD-X","C2-1B5","C2-DDA","C2X-M5","C3-0YD","C3I-D5","C3J0-O","C3N-3S","C4C-Z4","C-4D0W","C-4ZOS","C5-SUU","C-62I5","C6CG-W","C6C-K9","C-6YHJ","C6Y-ZF","C-7SBM","C7Y-7Z","C8-7AS","C8-CHY","C8H5-X","C8VC-S","C9N-CC","C9R-NO","C-9RRR","Cabeki","Cadelanne","Cailanar","Camal","Canard","Caretyn","Carirgnottin","Carrou","Caslemon","Cat","CB4-Q2","CBGG-0","C-BHDN","CBL-XP","CBY8-J","C-C99Z","CCE-0J","CCP-US","C-DHON","Central Point","C-FD0D","C-FER9","CFLF-P","C-FP70","CFYY-J","CH9L-K","C-H9X7","CHA2-Q","Chainelant","Chaktaren","Chamemi","Chamja","Chamume","Chaneya","Channace","Chanoun","Chantrousse","Chardalane","Charmerout","Charra","Chaven","C-HCGU","Chej","Chelien","Chemilip","Cherore","Chesiette","Chesoh","Chibi","Chidah","Chiga","Chitiamem","Choga","Choonka","CHP-76","CI4M-T","CIS-7X","Cistuvaert","C-J6MT","C-J7CR","CJF-1P","CJNF-J","C-KW6X","CKX-RW","CL-1JE","CL6-ZG","CL-85V","Clacille","Claini","Clarelam","Claulenne","Claysson","C-LBQS","CL-BWB","Clellinon","Cleyd","CL-IRS","CL-J9W","Clorteler","C-LP3N","C-LTXS","CLW-SI","C-N4OD","CNC-4V","CNHV-M","C-NMG9","CO-7BI","C-OK0R","Col","Colcer","Colelie","Conoban","Conomette","Costolle","Couster","Covryn","C-PEWN","CR-0E5","CR2-PQ","CR-AQH","Crielere","CR-IFM","Croleur","CRXA-Y","CSOA-B","CS-ZGD","CT7-5V","CT8K-0","CU9-T0","Cumemare","CUT-0V","C-V6DQ","C-VGYO","CVY-UC","C-VZAK","CW9-1Y","C-WPWH","CX-1XF","CX65-5","CX7-70","CX8-6K","CXN1-Z","C-XNUA","CYB-BZ","CY-ZLP","CZ6U-1","CZDJ-1","CZK-ZQ","D0-F4W","D-0UI0","D2AH-Z","D2EZ-X","D2-HOS","D-3GIQ","D3S-EA","D4-2XN","D4KU-5","D4R-H7","D5IW-F","D61A-G","D-6H64","D-6PKO","D6SK-L","D-6WS1","D7T-C0","D7-ZAC","D85-VD","D87E-A","D-8SI1","D9D-GD","D-9UEV","D9Z-VY","Dabrid","DABV-N","DAI-SH","Dakba","Dal","Dammalin","Danera","Dantan","Dantbeinn","Dantumi","Danyana","Daran","Daras","Dastryns","Datulen","DAYP-G","DB1R-4","DB-6W4","D-B7YK","D-BAMJ","DBRN-Z","DBT-GB","DCHR-L","DCI7-7","DCJ-ZT","D-CR6W","DDI-B7","DE71-9","DE-A7P","Dead End","Decon","Deepari","Defsunun","Dehrokh","DE-IHK","Deltole","Deninard","Derririntel","Deven","DFH-V5","DFTK-D","D-FVI7","DG-8VJ","DGDT-3","DG-L7S","D-GTMI","D-I9HJ","Diaderi","DIBH-Q","Dihra","Dimoohan","Direrie","Diromitur","Dital","D-IZT9","DJ-GBH","Djimame","DJK-67","D-JVGJ","DK0-N8","DK6W-I","DK-FXK","DKUK-G","DL1C-E","D-L4H0","DL-CDY","DN58-U","DNEP-Y","DNR-7M","DO6H-Q","DOA-YU","Dodenvale","Dodixie","D-OJEZ","Dom-Aphis","Dooz","Doril","Dour","Doussivitte","Doza","D-P1EH","DP-1YE","DP-2WP","DP34-U","DP-JD4","D-PNP9","D-Q04X","D-QJR9","DR-427","Dresi","Droselory","DS3-6A","D-SKWC","DS-LO3","DSS-EZ","DT-PXH","DT-TCD","DTX8-M","Du Annes","Dudreda","Dumkirinur","Dunraelare","DUO-51","Duripant","DUU1-K","DUV-5Y","DVN6-0","DVWV-3","D-W7F0","DW-N2S","DW-T2I","DX-DFJ","DX-TAR","DY-40Z","DY-F70","DY-P7Q","DYPL-6","Dysa","DYS-CG","DZ6-I5","E02-IK","E0DR-G","E1-4YH","E1F-E5","E1F-LK","E1UU-3","E1W-TB","E-1XVP","E2-RDQ","E3OI-U","E3-SDZ","E3UY-6","E4-E8W","E51-JE","E5T-CS","E6Q-LE","E-7U8U","E7VE-V","E7-WSY","E8-432","E8-YS9","E-91FV","E9G-MT","E9KD-N","E-9ORY","E-ACV6","EA-HSA","Ealur","Earled","Earwik","EAWE-2","E-B957","Eba","Ebasez","Ebasgerdur","E-BFLT","Ebidan","Ebo","Ebodold","Ebolfer","Ebtesham","E-BWUU","E-BYOS","E-C0SR","EC-P8R","E-D0VZ","Edani","Eddar","Edilkam","ED-L9T","Edmalbrurdus","E-DOF2","EDQG-L","E-EFAM","Efa","EF-F36","E-FIC0","EFM-C4","EF-QZK","Efu","Egbinger","Egbonbet","E-GCX0","Egghelende","Eggheron","Eglennaert","Egmar","Egmur","EH2I-P","Eha","Ehnoum","EIDI-N","Eifer","EIH-IU","Eiluvodi","EIMJ-M","EIN-QG","EI-O0O","Eitu","EIV-1W","EJ48-O","EJ-5X2","Ejahi","E-JCUS","EK2-ET","Ekid","EKPB-3","Ekuenbiron","Ekura","EL8-4Q","Elanoda","Elarel","Eldjaerin","Eldulf","Eletta","Elgoi","Ellmay","Elmed","Elonaya","Elore","Elunala","Embod","EMIG-F","Emolgranlan","Emrayur","Emsar","Enal","Enaluri","Endatoh","Enden","Enderailen","Endrulf","Enedore","Engosi","EN-GTB","Ennur","EN-VOD","EOA-ZC","EOE3-N","E-OGL4","EOT-XL","EOY-BG","EPCD-D","E-PR0S","EQI2-2","EQWO-Y","EQX-AE","ER2O-Y","Eram","Eranakko","Eredan","Erego","Erenta","Erila","Erindur","Erkinen","Erlendur","Erme","Erstet","Erstur","Ertoo","Eruka","Ervekam","ERVK-P","Erzoh","Esa","Esaeel","ESC-RI","E-SCTX","Esescama","Esesier","Eshtah","Eshwil","Eskunen","Esmes","Espigoure","ES-Q0W","Estaunitte","Esteban","Estene","Esubara","ES-UWY","Eszur","Etav","Ethernity","ETO-OT","ETXT-F","EU0I-T","EU9-J3","Eugales","Eurgrana","Eust","EUU-4N","EU-WFW","Evati","Evaulon","Evettullur","E-VKJV","Evuldgenzo","EW-JR5","E-WMT7","EWN-2U","EWOK-K","EX-0LQ","EX6-AO","EX-GBT","Exit","E-YCML","Eygfe","E-YJ8G","Eystur","Eytjangard","E-Z2ZX","EZA-FM","EZWQ-X","Ezzara","F18-AY","F2-2C3","F2A-GX","F2-NXA","F2OY-X","F2W-C6","F3-8X2","F39H-1","F-3FOY","F-3H2P","F48K-D","F4R2-Q","F5-CGW","F-5FDA","F5FO-U","F5M-CC","F-5WYK","F67E-Q","F69O-M","F-749O","F76-8Q","F7A-MR","F7C-H0","F7-ICZ","F-816R","F-88PJ","F8K-WQ","F-8Y13","F9E-KX","F-9F6Q","F9-FUV","F9O-U9","F-9PXR","F9SX-1","F-A3TR","Fabin","Fabum","FA-DMO","Fageras","Fahruni","Faktun","Fanathor","Farit","Faspera","Fasse","Faswiba","FAT-6P","Faurent","Faurulle","FB5U-I","FBH-JN","FB-MPY","FC-3YI","F-D49D","FD53-H","FD-MLJ","F-DTOO","FDZ4-A","FE-6YQ","Fegomenko","F-EM4Q","Fensi","Fera","Ferira","Feshur","FG-1GH","F-G7BO","FGJP-J","FHB-QA","F-HQWV","FH-TTC","FIDY-8","Fihrneh","Fildar","Finanar","Finid","FIO1-8","Firbha","FIZU-X","FJ-GUR","FKR-SR","Fliet","FLK-LJ","Floseswin","Flost","Fluekele","F-M1FU","FMB-JP","FMBR-8","FMH-OV","FM-JK5","F-MKH3","FN0-QS","FN-DSR","FN-GFQ","F-NMX6","F-NXLQ","FO1U-K","FO8M-2","FO9-FZ","Fobiner","Fora","Foves","Fovihi","FQ9W-C","F-QQ5N","FR46-E","Frarie","Frarn","Frarolle","FR-B1H","Freatlidur","Fredagod","Frerstorn","Fricoure","Friggi","F-RT6Q","FRTC-5","Frulegur","FS-RFL","FSW-3C","F-TE1T","F-TQWO","F-TVAP","Funtanainen","Furskeshin","Fuskunen","Futzchag","F-UVBV","FV1-RQ","FVQF-W","FV-SE8","FVXK-D","FV-YEA","FWA-4V","F-WCLC","FWST-8","F-WZYG","FX4L-2","FX-7EM","F-XWIN","FY0W-N","FYD-TO","F-YH5B","FYI-49","FZ-6A5","F-ZBO0","FZCR-3","FZSW-Y","FZX-PU","G063-U","G06-8Y","G-0Q86","G1-0UI","G15Z-W","G1CA-Y","G1D0-G","G2-INZ","G-3BOG","G3D-ZT","G-4H4C","G4-QU6","G5ED-Y","G-5EN2","G5-EN3","G-6SXJ","G-73MR","G7AQ-7","G-7WUF","G8AD-C","G95F-H","G95-VZ","G96R-F","G9D-XW","G9L-LP","G9NE-B","GA-2V7","GA58-7","GA9P-0","Gademam","Gaha","Gaknem","Galeh","Gallareue","Gallusiene","Galnafsad","Gamdis","Gamis","Gammel","G-AOTH","GA-P6C","Gare","Garisas","Gasavak","Gateway","Gayar","G-B22J","G-B3PR","GB-6X5","GBT4-J","G-C8QO","GC-LTF","G-D0N3","GDEW-0","GDHN-K","GDO-7H","GE-8JV","GE-94X","Gebuladi","Gedugaud","Geffur","Gehi","GEKJ-9","Gekutami","Gelfiven","Gelhan","Gemodi","Gens","Gensela","Geras","Gerbold","Gerek","Gererique","Gergish","Gerper","Gesh","Getrenjesa","G-EURJ","Geztic","GF-3FL","GF-GR7","G-G78S","GGE-5Q","GGMF-J","G-GRSZ","G-HE0N","Ghekon","Ghesis","Gheth","Ghishul","GHZ-SJ","Gicodel","Gid","Gidali","GIH-ZG","Girani-Fa","Gisleres","GJ0-OJ","G-JC9R","GK3-RX","GK5Z-T","G-KCFT","GKP-YT","GL6S-2","G-LOIT","GM-0K7","G-M4GK","G-M4I8","GM-50Y","G-M5L3","G-ME2K","GME-PQ","GMLH-K","GN7-XY","GN-PDU","GN-TNT","Goinard","Gomati","Gonan","Gonditsa","Gonheim","Goni","GOP-GE","Goram","Gosalav","Goudiyah","Gousoviba","GPD5-0","GPLB-C","GPUS-A","GQ2S-8","G-Q5JU","GQ-7SP","GQLB-V","G-QTSD","G-R4W1","Gratesier","GRHS-B","Grinacanne","Grispire","GR-J8B","GRNJ-3","Groothese","GR-X26","GSO-SR","GTB-O4","GTQ-C9","G-TT5V","GTY-FW","GU-54G","GU-9F4","Gukarla","Gulfonodi","Gulmorogod","Gultratren","Gusandall","G-UTHL","G-VFVB","GVZ-1W","G-W1ND","GW7P-8","GXK-7F","GY5-26","GY6A-L","Gyerzen","Gyng","G-YT55","G-YZUX","GZ1-A1","GZM-KB","H-1EOH","H1-ESN","H1-J33","H23-B5","H-29TM","H-4R6Z","H4X-0I","H-5GUI","H5N-V7","H-64KI","H65-HE","H6-CX8","H6-EYX","H74-B0","H7O-JZ","H7S-5I","H-8F5Q","H8-ZTO","H90-C9","H-93YV","H9-J8N","H9S-WC","Haajinen","Haatomo","Habu","Hadaugago","Hadji","H-ADOC","Hadonoo","Hadozeko","Hageken","Hagilur","Hahda","Hahyil","Hai","Haimeh","Haine","H-AJ27","HAJ-DQ","Hakana","Hakatiz","Hakeri","Hakisalki","Hakodan","Hakonen","Hakshma","Halaima","Halenan","Half","Halibai","Hallanen","Halle","Halmah","Ham","Hama","Hampinen","Hamse","Hanan","Hangond","Hapala","Haras","Hardbako","Hare","Harerget","Harner","Harroule","Harva","Hasama","Hasateem","Hasiari","Hasmijaala","Hatakani","Hath","Hati","Hatori","Hayumtom","HB-1NJ","HB-5L3","HB7R-F","HBD-CC","HB-FSO","HB-KSF","HD-AJ7","HD-HOZ","HD-JVQ","HE5T-A","Hebisa","H-EBQG","Hecarrin","Hedaleolfarber","Hedgiviter","HED-GP","Hedion","Hedoubel","Hegfunden","Heild","Hek","Helgatild","Heluene","Hemin","Hemouner","Henebene","Hentogaira","Heorah","Herila","Hesarid","HE-V4V","Hevrice","H-EY0P","Heydieles","Hezere","HFC-AQ","H-FGJO","HF-K3O","H-FOYG","H-GKI6","HG-YEQ","HHE5-L","H-HGGJ","H-HHTH","HHJD-5","HHK-VL","HHQ-M1","H-HWQR","Hibi","Hier","Hikansog","Hikkoken","HIK-MC","Hilaban","Hilfhurmur","Hilmar","Hiramu","Hiremir","Hirizan","Hiroudeh","Hirri","Hirtamon","Hishai","Hisoufad","Hitanishio","HIX4-H","Hizhara","HJ-BCH","HJO-84","Hjoramold","Hjortur","HKYW-T","HLR-GL","HL-VZX","HLW-HP","H-M1BY","HMF-9D","H-MHWF","HM-UVD","HM-XR2","H-NOU5","H-NPXW","HO4E-Q","Hodrold","Hofjaldgund","Hogimo","HOHF-B","Hoona","Hophib","Horaka","Horir","Horkkisen","Hoseen","Hoshoun","Hostakoh","Hostni","Hothomouh","Hotrardik","H-P4LB","HP-64T","HP-6Z6","H-PA29","HPBE-D","HPMN-V","HPS5-C","HPV-RJ","HQ-Q1Q","HQ-TDJ","Hrober","Hroduko","Hrokkur","Hrondedir","Hrondmund","Hror","H-RXNZ","H-S5BM","H-S80W","H-T40Z","HT4K-M","H-UCD1","Hulm","Hulmate","Huna","Huola","Hurjafren","Hurtoken","Hutian","Huttaken","HV-EAP","HVGR-R","H-W9TY","HXK-J6","H-YHYM","Hykanima","Hykkota","HYPL-V","HY-RWO","Hysera","HZAQ-W","HZFJ-M","HZID-J","HZ-O18","I0AB-R","I0N-BM","I-1B7X","I1-BE8","I-1QKL","I1Y-IU","I-2705","I2D3-5","I30-3A","I3CR-F","I-3FET","I3Q-II","I5Q2-S","I64-XB","I6M-9U","I6-SYN","I-7JR4","I-7RIS","I7S-1S","I8-AJY","I-8D0G","I-9GI1","I9-ZQZ","IAK-JW","IAMJ-Q","Iaokit","IAS-I5","Ibani","Ibaria","Ibash","IBOX-2","Ibura","Ichinumi","Ichoriya","I-CMZA","I-CUVX","Iderion","Ides","I-E3TG","Ienakkamon","Iesa","Iffrue","IFJ-EL","IF-KD1","IG-4OF","IGE-NE","IGE-RI","Iges","Ignebaener","Ignoitton","IG-ZAM","Ihakana","Ihal","I-HRX3","II-5O9","Iidoken","IIRH-G","Iitanmadan","Iivinen","Ikami","Ikao","Ikoskio","IKTD-P","Ikuchi","Ilahed","Ilas","IL-H0A","Illamur","Illi","Illinfrik","Illuin","IL-OL1","Ilonarav","Iluin","IL-YTR","Imata","I-ME3L","Imeshasa","I-MGAB","Imih","IMK-K1","Immuri","Imya","Inari","Inaro","Inaya","Inder","Indregulle","Inghenges","I-NGI8","Ingunn","Inis-Ilix","Innia","Inoue","INQ-WR","Intaki","ION-FG","IOO-7O","IO-R2S","Iosantin","IP6V-X","IPAY-2","IP-MVJ","Ipref","IPX-H5","I-QRJA","Iralaja","IRD-HU","IR-DYY","IRE-98","IR-FDV","Irgrus","Irjunen","Irmalin","Irnal","Irnin","Iro","Irshah","IR-WT1","Isamm","Isanamo","Isaziwa","Isbrabata","Isenairos","Isenan","Isendeldik","Ishisomo","Ishkad","Ishomilken","Isid","Isie","Isikano","Isikemi","Isikesu","Isinokka","IS-OBW","IS-R7P","Isseras","Istodard","Isutaka","Iswa","Itamo","Ithar","Itrin","Itsyamil","IT-YAU","IU-E9T","IUU3-L","I-UUI5","Ivar","Ivih","Ivorider","IVP-KA","IV-UNR","Iwisoda","IWZ3-C","IX8-JB","Iyen-Oursta","I-YGGI","IZ-AOB","J-0KB3","J1AU-9","J1H-R4","J1-KJP","J2-PZ6","J4AQ-O","J-4FNO","J4UD-J","J52-BH","J5A-IX","J5NU-K","J6QB-P","J7A-UR","J7-BDX","J7M-3W","J7X-VN","J7YR-1","J94-MU","J9-5MQ","J9A-BH","J9SH-A","J-A5QD","Jachanu","JA-G0T","Jakanerva","Jakri","Jambu","Jamunda","Jan","Jangar","Janus","JA-O6J","Jarizza","Jark","Jarkkolen","Jarshitsan","Jarzalad","Jaschercis","Jasson","Jaswelu","Jatate","JAUD-V","Javrendei","JAWX-R","J-AYLV","Jaymass","Jayneleb","JBUH-H","JBY6-F","J-CIJV","JC-YX8","J-D5U7","JDAS-0","JD-TYH","JE1-36","JE-D5U","Jedandan","JEIV-E","Jel","Jeni","Jennim","JEQG-7","Jeras","Jerhesh","Jerma","Jeshideh","Jesoyeh","JE-VLG","JFV-ID","J-GAMP","JGOW-Y","JGW-OT","JH-M2W","JI1-SY","JI-1UQ","JI-K5H","JI-LGM","Jinizu","Jinkah","Jita","JK-GLL","JKJ-VJ","JK-Q77","JKWP-U","J-L9MA","JLH-FN","JLO-Z3","J-LPX7","JL-ZUQ","JM0A-4","JMH-PT","JNG7-K","JO-32L","J-OAH2","Joamma","J-ODE7","Jofan","J-OK0C","Jolevier","Jolia","Jondik","Joppaya","Joramok","Jorund","Jorus","Josameto","Josekorn","Jotenen","Jouvulen","Jovainnon","JP4-AA","JPEZ-R","JPL-RA","J-QA7I","J-QOKQ","JQU-KY","J-RQMF","J-RVGD","J-RXYN","JRZ-B9","JS-E8E","JSI-LL","JT2I-7","JTA2-2","JTAU-5","J-TPTA","Juddi","Judra","JUE-DX","Jufvitte","JUK0-1","Junsen","Junsoraert","JU-OWQ","Jurlesel","JURU-T","Juunigaishi","JU-UYK","JV1V-O","JVA-FE","JVJ2-N","JWJ-P1","JWZ2-V","JXQJ-B","JX-SOA","J-Z8C2","JZ-B5Y","JZL-VB","JZ-UQC","JZV-F4","J-ZYSZ","K0CN-3","K1I1-J","K-1OY3","K1Y-5H","K212-A","K25-XD","K3JR-J","K-3PQW","K42-IE","K4-RFZ","K4UV-G","K4YZ-Y","K5F-Z2","K5-JRD","K-6K16","K-6SNI","K717-8","K76A-3","K7D-II","K7-LDX","K7S-FF","K85Y-6","K88X-J","K8L-X7","K-8SQS","K8X-6B","K95-9I","K-9UG4","KA6D-K","Kaaputenen","Kadlina","Kador Prime","Kahah","Kaimon","Kaira","Kakakela","Kakki","Kamda","Kamela","Kamih","Kamio","Kamokor","Kappas","Karan","Kari","Karjataimon","Kasi","Kasrasi","Kassigainen","Kattegaud","Katugumur","Kaunokka","Kausaaja","Kazna","K-B2D3","K-B8DK","KBAK-I","K-BBYU","KBP7-G","KB-U56","KCDX-7","KCT-0A","KDF-GY","KDG-TA","KD-KPR","KDV-DE","KE-0FB","Keba","Keberz","KED-2O","Kedama","KEE-N6","Kehjari","Kehour","Kehrara","Keikaken","KEJY-U","Kemerk","Kenahehab","Kenninck","Kenobanala","Keproh","Kerepa","Keri","Kerying","Keseya","Keshirou","KFIE-Z","KFR-ZE","KGCF-5","KGT3-6","KH0Z-0","Khabara","Khabi","Khafis","Khanid Prime","Khankenirdia","Kheram","KH-EWC","Khnar","Khopa","KI2-S3","Kiainti","Kibursha","Kiereend","KIG9-K","Kihtaled","Kinakka","Kino","Kirras","Kiskoken","Kisogo","KI-TL0","K-IYNW","Kizama","K-J50B","KJ-QWL","KJ-V0P","KK-L97","KL3O-J","K-L690","Klaevik","Klingt","Klir","KLMT-W","Klogori","KLY-C0","KLYN-8","KMC-WI","K-MGJ7","KMH-J1","KMQ4-V","KMV-CQ","Knophtikoo","Kobam","KOI8-Z","Komaa","Komo","Konola","Konora","Koona","Kooreng","Korama","Korasen","Kor-Azor Prime","Korridi","Korsiki","Kothe","Kourmonen","KP-FQ1","KPI-OW","KQK1-2","K-QWHE","KR8-27","Krilmokenur","Krirald","K-RMI5","Kronsur","KRPF-A","KRUN-N","KR-V6G","KS-1TS","KS8G-M","KSM-1T","KTHT-O","KU3-BB","KU5R-W","Kubinen","Kudi","Kuharah","Kuhri","Kulelen","Kulu","Kuoka","Kuomi","Kurmaru","Kurniainen","Kusomonmon","KV-8SN","KVN-36","KW-1MV","KW-I6T","KW-OAM","KX-2UI","K-X5AX","K-XJJT","K-YI1L","K-YL9T","Kylmabe","K-Z0V4","KZ9T-C","KZFV-4","L0AD-B","L-1HKR","L1S-G1","L-1SW8","L1YK-V","L2GN-K","L3-I3K","L3-XYO","L4X-1V","L4X-FH","L5D-ZL","L-5JCJ","L5-UWT","L5Y4-M","L6B-0N","L-6BE1","L6BY-P","L-6W1J","L7-APB","L7-BLT","L7XS-5","L8-WNE","LA2-KV","L-A5XP","L-A9FS","Laah","Labapi","Lachailes","Laddiaha","Ladistier","Lahnina","Laic","Lamaa","Lamadent","Lanngisi","Lansez","Lantorn","Lari","Larkugei","Larryn","L-AS00","Lashesih","Lashkai","Lasleinur","Latari","Laurvier","Lazara","Lazer","LB0-A1","L-B55M","LBA-SO","LBC-AW","LBGI-2","LBV-Q1","LC-1ED","L-C3O7","LD-2VL","LE-67X","LEK-N5","Lela","LEM-I1","Leran","Leremblompes","Lermireve","Leurtmar","L-EUY2","Leva","LF-2KP","L-FM3P","L-FVHR","LGK-VP","LGL-SD","LG-RO2","LGUZ-1","LG-WA9","L-GY1B","LHGA-W","LHJ-2G","LH-LY1","LH-PLU","L-HV5C","Libold","L-IE41","Liekuri","Lilmad","Liparer","Lirerim","Lirsautton","Lisbaetanne","Lisudeh","Litiura","Litom","Liukikka","LIWW-P","LJK-T0","LJ-RJK","LJ-TZW","LJ-YSW","LK1K-5","LKZ-CY","L-L7PE","L-M6JK","LMM7-L","LN-56V","LNVW-K","LO5-LN","Loes","Loguttur","LOI-L1","Lor","Lossa","Lour","Lower Debyl","LP1M-Q","L-P3XM","L-POLO","LPVL-5","LQ-01M","LQ-AHE","LQ-OAI","L-QQ6P","LQQH-J","LR-2XT","LRWD-B","LS3-HP","LS9B-9","LSC4-P","L-SCBU","LS-JEP","LS-QLX","LS-V29","LT-DRO","L-TLFU","L-TOFR","L-TS8S","LTT-AP","LT-XI4","LUA5-L","LU-HQS","Lulm","LUL-WX","Lumegen","Luminaire","Luromooh","Luse","Lustrevik","LVL-GZ","L-VXTK","L-WG68","LWX-93","LW-YEW","LX5K-W","LXQ2-T","LXTC-S","LXWN-W","LX-ZOJ","L-YMYU","LY-WRW","LZ-6SU","L-Z9KJ","L-Z9NB","L-ZJLN","M0O-JG","M1BZ-2","M1-PX9","M2-2V1","M2-CF1","M2GJ-X","M2-XFE","M3-H2Y","M3-KAQ","M4-GJ6","M-4KDB","M4-KX5","M4U-EH","M53-1V","M5-CGW","M5NO-B","M-75WN","M-76XI","M9-FIB","M9-LAN","M9-MLR","M9U-75","M-9V5D","Maalna","Mabnen","Madimal","Madirmilire","Madomi","Mafra","Magiko","Mahnagh","Mahrokht","Mahti","Mahtista","Mai","Maiah","Maila","Maire","Majamar","Makhwasan","Malkalen","Malma","Malpara","Malukker","Mamenkhanar","Mamet","Manarq","Manatirid","Mandoo","Mani","Manjonakko","Mannar","Mantenault","Mara","Marmeha","Marosier","Martha","Marthia","Martoh","Masalle","Masanuh","Maseera","Mashtarmem","Maspah","Mastakomon","Mateber","Mattere","Maturat","Matyas","Maurasi","Maut","MA-VDX","MA-XAP","Mazitah","MB4D-4","MB-NKE","MC4C-H","MC6-5J","MC6O-F","M-CMLV","M-CNUD","MD-0AW","MDD-79","ME-4IU","Mehatoor","Meildolf","Meimungen","Meirakulf","M-EKDF","Melmaniel","Menai","Mendori","Menri","Mercomesier","Merolles","Merz","Mesokel","Messoya","Mesybier","Metserel","Meunvon","Meves","MF-PGF","MG0-RD","MGAM-4","MH9C-S","MHC-R3","M-HU4V","MI6O-6","Miah","Miakie","Mies","Mifrata","Mikhir","Milal","Mili","Milu","Mimen","Mimime","Mimiror","Minin","Mirilene","Miroitem","Miroona","Misaba","Misha","Mishi","Misneden","Mista","Mitsolen","Miyeli","MJ-5F9","MJI3-8","MJ-LGH","MJ-X5V","MJXW-P","MJYW-3","MKD-O8","MKIG-5","M-KXEH","MK-YNM","MLQ-O9","M-MBRT","M-MCP8","M-MD31","M-MD3B","MMR-LZ","MMUF-8","MN5N-X","M-N7WD","MN9P-A","M-NKZM","M-NP5O","MN-Q26","M-NWLB","Moclinamaud","MOCW-2","Mod","Modun","M-OEE8","MO-FIF","MO-GZ5","Moh","Mohas","MO-I1W","Molea","Mollin","Moniyyuku","Mora","Mormelot","Mormoen","Moro","MOSA-I","Moselgi","Mosson","Motsu","Moussou","Moutid","MO-YDG","Mozzidit","MP5-KR","M-PGT0","MPPA-A","MQFX-Q","MQ-NPY","MQ-O27","MR4-MY","M-RPN3","MS1-KJ","MS2-V8","M-SG47","MSG-BZ","MSHD-4","MSKR-1","M-SRKS","MS-RXH","MT-2VJ","MT9Q-S","MTGF-2","MTO2-2","M-UC0S","Muer","Muetralle","Munory","Murema","Murethand","Murini","Murzi","Mushikegi","Muttokon","Muvolailen","MUXX-4","M-V0PQ","M-VACR","MVCJ-E","M-VEJZ","MVUO-F","MWA-5Q","M-XUZZ","MXX5-9","MXYS-8","Mya","M-YCD4","MY-T2P","MY-W1V","M-YWAL","Myyhera","MZ1E-P","M-ZJWJ","MZLW-9","MZPH-W","N06Z-Q","N0C-UN","N2IS-B","N2-OQG","N3-JBX","N-5476","N-5QPW","N5Y-4N","N6G-H3","N6NK-J","N-6Z8B","N7-BIY","N-7ECY","N7-KGJ","N-8BZ6","N8D9-Z","N8XA-L","N-8YET","Nadohman","Naeel","Nafomeh","Nafrivik","Naga","Nagamanen","Naguton","Nahol","Nahrneder","Nahyeen","Naka","Nakah","Nakatre","Nakis","Nakregde","Nakri","Nakugard","Nalnifan","Nalu","Nalvula","Namaili","Nandeza","Nani","Nannaras","Narai","Nardiarang","Nare","Nasesharafa","Nasreri","Nausschie","Nazhgete","NB-ALM","NBO-O0","NBPH-N","NBW-GD","NCG-PW","NCGR-Q","NC-N3F","N-CREL","ND-GL4","NDH-NV","NDII-Q","N-DQ0D","ND-X7X","NE-3GR","Nebian","Neburab","Ned","Neda","Nedegulf","Neesher","NEH-CS","Nehkiah","Nein","Nema","Nennamaila","Nererut","Netsalakka","NEU-UD","New Caldari","New Eden","Ney","Neyi","Neziel","N-FK87","NFM-0V","NG-C6Y","NG-M8K","NGM-OK","NH-1X6","N-H32Y","N-H95C","N-HK93","NHKO-4","NH-R5B","N-HSK0","N-I024","Niarja","Nibainkier","Niballe","Nidebora","NIDJ-K","Nidupad","Nielez","Nieril","Nifflung","NIF-JE","Nifshed","NIH-02","NI-J0B","Nikh","Nikkishina","Nimambal","NIM-FY","Nirbhi","Nishah","Nisuwa","Niyabainen","NIZJ-0","NJ4X-S","N-JK02","NK-7XO","NK-VTL","NL6V-7","NLO-3Z","NLPB-0","N-M1A3","NM-OEA","N-O53U","Noghere","Noli","NOL-M9","Nomaa","Nomash","Nonni","Noranim","Nordar","Nosodnis","Notoras","Nourbal","Nourvukaiken","Nouta","NP6-38","NPD9-A","N-PS2Y","N-Q5PW","NQ-9IH","NQH-MR","NQ-M6W","NR8S-Y","N-RAEL","NRD-5Q","N-RMSH","NRT4-U","NS2L-4","NSBE-L","N-SFZK","NSI-MW","N-TFXK","NTV0-1","NU4-2G","NUG-OF","Nuken","Nuzair","NV-3KA","NW2S-A","NWX-LI","NX5W-U","NY6-FH","N-YLOE","NZG-LF","NZPK-G","NZW-ZO","O-0ERG","O-0HW8","O1-FTD","O1Q-P1","O1Y-ED","O2-39S","O2O-2X","O-2RNZ","O31W-6","O3-4MN","O36A-P","O3L-95","O3Z5-G","O4T-Z5","O5Q7-U","O-5TN1","O5Y3-W","O5-YNW","O7-7UX","O-7LAI","O7-RFZ","O7-VJ5","O-8SOC","O8W-5O","O94U-A","O-97ZG","O-9G5Y","O9K-FT","O9V-R7","O-A6YN","OAIG-0","OAQY-M","Obalyu","Obanen","O-BDXB","Obe","Oberen","OBK-K8","Obrolber","OBV-YC","O-BY0Y","O-CNPR","O-CT8N","Octanneve","OCU4-R","Odamia","Odatrik","Oddelulf","Odebeinn","Odette","Odin","Odinesyn","Odixie","Odlib","Odotte","OE-4HB","OE-9UF","OEG-K9","Oerse","O-EUHA","OEY-OR","O-F4SN","Ofage","Offikatlin","Offugen","Ofstold","O-FTHE","OFVH-Y","Ogaria","OGL8-Q","Ogoten","Oguser","OGV-AS","OGY-6D","Ohbochi","Ohide","Ohkunen","Ohmahailen","Ohvosamon","Oichiya","Oicx","Oijamon","Oijanen","Oimmo","Oinasiken","Oiniken","O-IOAI","OIOM-Y","Oipo","Oirtlair","Oishami","Oisio","O-IVNH","OJ-A8M","OJ-CT4","OJOS-T","O-JPKH","OJT-J3","OK-6XN","Okagaiken","OKEO-X","Okkamon","OL3-78","Olbra","Old Man Star","Olelon","Olettiers","Olfeim","Olide","Olin","O-LJOO","Olo","O-LR1H","Omam","O-MCZR","Omigiav","Ommaerrer","Ommare","O-N589","O-N8XZ","Onanam","Onatoh","Onazel","Ondree","Onga","Ongund","Onnamon","Onne","Ono","Onsooh","Ontorn","Onuse","O-O2GN","OOO-FS","O-OVOQ","OP7-BP","OP9L-F","O-PNSN","Oppold","O-QKSM","OQTY-Z","OR-7N5","Oraekja","ORB4-J","Ordat","Ordion","Ordize","Orduin","Oremmulf","Orfrold","Orgron","O-RIDF","Orien","Orkashu","Oruse","Orva","Orvolle","O-RXCZ","Osaa","Osaumuni","Oshaima","Osis","Osmallanais","Osmeden","Osmomonne","Osmon","Osoggur","Ossa","Ostingele","Osvestmunnur","Osvetur","OSW-0P","OSY-UD","Otakod","Otalieto","Otanuomi","Otela","Otelen","Otitoh","OTJ-4W","OTJ9-E","Oto","Otomainen","Otosela","Otou","Otraren","Otsasai","Otsela","O-TVTD","Ouelletta","Oulley","Ouranienen","Ourapheh","Oursulaert","Outuni","OU-X3P","O-VWPB","OW-QXW","OW-TPO","OWXT-5","OXC-UL","OXIY-V","OX-RGN","OX-S7P","OY0-2T","O-Y5JQ","Oyeman","Oyonata","OY-UZ1","OZ-DS5","OZ-VAE","O-ZXUV","P1T-LP","P-2TTL","P-33KR","P3EN-E","P3X-TN","P-3XVV","P4-3TJ","P5-EFH","P5-KCC","P65-TA","P-6I0B","P7-45V","P7MI-T","P7UZ-T","P7Z-R3","P8-BKO","P-8PDJ","P9F-ZG","Paala","PA-ALN","Paara","Pahineh","Pain","Pakhshi","Pakkonen","Palas","Palmon","Palpis","Pamah","Pananan","Parchanier","Parouz","Parses","Partod","Parts","Pasha","Pashanai","Passari","Pator","Patzcha","Pavanakka","PA-VE3","Paye","PB-0C1","PBD-0G","PC9-AY","PDE-U3","PDF-3Z","P-E9GN","Pedel","PE-H02","PEK-8Z","Pelille","Pelkia","Pemene","PEM-LC","Pemsah","Penirgman","Pera","Perbhe","Perckhevin","Perdan","Perimeter","Pertnineere","PE-SAM","Petidu","Pettinck","Peyiri","PF-346","PF-KUQ","PFP-GU","PF-QHK","P-FSQE","PFU-LH","PFV-ZH","P-GKF5","P-H5IY","PH-NFR","Phoren","PI5-39","Piak","Piekura","Pimebeka","Pimsu","Piri","Pirna","Pirohdim","PKG4-7","PKN-NJ","PK-PHZ","PM-DWE","PMV-G6","P-N5N9","PNDN-V","PND-SI","PNFW-O","P-NI4K","PNQY-Y","P-NRD3","PNS7-J","P-NUWP","PO-3QW","PO4F-3","Pochelympe","Podion","Poinen","Poitot","Polfaly","Polstodur","POQP-K","Porsharrah","Postouvin","Pout","Pozirblant","PPFB-U","PPG-XC","PQRE-W","PR-8CA","Prism","Promised Land","PS-94K","Psasa","Pserz","PSJ-10","PT-21C","PT-2KR","P-T9VC","Pucherie","PUC-JZ","P-UCRP","PUIG-F","Pulin","Purjola","PU-UMM","PUWL-4","PUZ-IO","PVF-N9","PVH8-0","P-VYVL","PWPY-4","PX5-LR","PXE-RG","PXF-RF","PX-IHN","Pynekastoh","PYY3-5","PZMA-E","P-ZMZV","PZOZ-K","P-ZWKH","Q-02UL","Q0G-L8","Q0J-RH","Q0OH-V","Q1-R7K","Q1U-IU","Q2FL-T","Q2-N6W","Q3-BAY","Q-3HS5","Q4C-S5","Q-4DEC","Q-5211","Q5KZ-W","Q61Y-F","Q7E-DU","Q7-FZ8","Q-7SUI","QA1-BT","QB-AE6","QBH5-F","QBL-BV","QBQ-RF","QBZO-R","Q-CAB2","QCDG-H","QCGG-Q","QCKK-T","QCWA-Z","QC-YX6","QE2-FS","QE-E1D","Q-EHMJ","QETZ-W","Q-FEEJ","QFEW-K","QFF-O6","QFGB-E","QFIU-K","QFRV-2","QFU-4S","QG3-Z0","Q-GICU","Q-GQHN","Q-HESZ","QHH-13","Q-HJ97","QHJ-FW","QHJR-E","QHY-RU","QI9-42","QIMO-2","QI-S9W","Q-ITV5","Q-JQSG","Q-K2T7","QK-CDG","QKCU-4","QKQ3-L","QKTR-L","Q-L07F","QLPX-J","QLU-P0","QM-20X","QM-O7J","QN-6J2","Q-NA5H","Q-NJZ4","QNXJ-M","QOK-SX","QO-SRI","QP0K-B","QPO-WI","QPTT-F","Q-Q2S6","QQ3-YI","QQGH-G","Q-R3GP","QRBN-M","QRFJ-Q","QRH-BF","QR-K85","QS-530","Q-S7ZD","QSCO-D","QSF-EJ","QSM-LM","Q-TBHW","QT-EBC","QTME-D","Q-U96U","Q-UA3C","Q-UEN6","Quier","Q-UVY6","QV28-G","Q-VTWJ","QWF-6P","QX-4HO","QXE-1N","Q-XEB3","QX-LIJ","QXQ-BA","QXQ-I6","QXW-PV","QY1E-N","QY2Y-N","QY6-RK","QYD-WK","QYT-X8","QYZM-W","QZ1-OH","QZ-DIZ","QZV-X3","QZX-L9","R0-DMM","R1-IMO","R1O-GN","R-2R0G","R2TJ-1","R-3FBU","R3-K7K","R3P0-Z","R3W-XU","R4K-8L","R4N-LD","R4O-I6","R5-MM8","R-6KYM","R6XN-9","R8-5XF","R8S-1K","R8WV-7","R959-U","R97-CI","Raa","Radima","Raeghoscon","Rafeme","R-AG7W","Ragnarg","Rahabeda","Rahadalon","RAI-0E","Raihbaka","Rairomon","Rakapas","Rammi","Rancer","Rand","Raneilles","Ranni","Rannoze","RA-NXN","Raravath","Raravoss","Raren","R-ARKN","Rashagh","Rashy","Rasile","Ratillose","Rauntaka","Raussinen","Ravarin","Rayeret","R-AYGT","Rayl","R-BGSU","RBW-8G","RCI-VL","RD-FWY","RD-G2R","REB-KR","Reblier","RE-C26","Reisen","Reitsato","Remoriu","Renarelle","Rens","Renyn","Rephirib","RERZ-L","Resbroko","Reschard","Reset","R-ESG0","Reteka","Rethan","Reyi","Reynire","RF6T-8","RF-CN3","RF-GGF","RFGW-V","RF-K9W","R-FM0G","RF-X7V","RG9-7U","RGU1-T","RH0-EG","RHE7-W","Riavayed","Ridoner","RI-JB1","Rilera","Rimbah","Riramia","RIT-A7","RIU-GC","RJ3H-0","RJBC-I","R-K4QY","RKE-CP","RKM-GE","RK-Q51","R-KZK7","RLDS-R","RL-KT0","RLL-9R","RLSI-V","RLTG-3","R-LW2I","RMOC-W","RNF-YH","RNM-Y6","RO0-AF","RO-0PZ","RO90-H","RO-AIQ","R-OCBA","Rohamaa","ROIR-Y","ROJ-B0","Rokofur","Roleinn","Romi","Roniko","Ronne","R-ORB7","Rorsins","RORZ-H","Roua","Roushzar","RP2-OQ","R-P7KL","RP-H66","RPS-0K","RQ9-OZ","RQH-MY","RQNF-9","RQN-OO","RQOO-U","RR-D05","R-RE2B","R-RMDH","R-RSZZ","RRWI-5","RSE-PT","RSS-KA","RT64-C","RT-9WL","RTX0-S","Ruchy","Ruerrotta","RUF3-O","Rumida","RU-PT9","Ruvas","RV5-DW","RV5-TT","RVCZ-C","RV-GA8","RVRE-Z","RWML-A","RXA-W1","R-XDKM","RXTY-4","RY-2FX","RYC-19","Ryddinjorn","RYQC-I","R-YWID","RZ3O-K","RZ8A-P","RZC-16","R-ZESX","RZ-PIY","RZ-TI6","R-ZUOL","S0U-MO","S1DP-Y","S-1LIO","S1-XTL","S-1ZXZ","S25C-K","S4-9DN","S-51XG","S5W-1Z","S-6HHN","S6QX-N","S7WI-F","S8-NSQ","S91-TI","S-9RCJ","S9X-AX","Saana","Saatuban","Sabusi","Sacalan","Sadana","Sadye","Safilbab","Safizon","Safshela","Sagain","SAH-AD","Sahda","Sahdil","Saheri","Sahtogas","Saidusairos","Saikamon","Saikanen","Saila","Saisio","SAI-T9","Sakenta","Sakht","Sakhti","Sakkikainen","Sakulda","Salah","Salashayama","Saloti","Samanuni","Saminer","Sankkasen","Santola","Saphthar","Saranen","Sarekuwa","Sarenemi","Sari","Sarline","Sarum Prime","Sasiekko","Sasoutikh","Sassecho","Sasta","Satalama","Sayartchen","Sazilid","Sazre","SB-23C","S-B7IT","SBEN-Q","SBL5-R","S-BWWQ","Scheenins","Schmaeel","Schoorasana","Scolluzer","S-CUEA","Scuelazyns","SD4A-2","S-DLKC","S-DN5M","S-E6ES","Sechmaren","Sehmosh","Sehmy","Sehsasez","Seil","Seiradih","Seitam","Semiki","Senda","Sendaya","Serad","Serpentis Prime","Serren","Seshala","Seshi","SE-SHZ","S-EVIQ","Seyllin","SF-XJS","SG-3HY","SG-75T","S-GKKR","SH1-6P","SH6X-F","Shabura","Shach","Shafrak","Shaggoth","Shaha","Shajarleg","Shakasi","Shala","Shalne","Shamahi","Shapisin","Sharhelund","Sharios","Sharir","Sharji","Sharuveil","Sharza","Shastal","SHBF-V","Shedoo","Shemah","Shenda","Shenela","Shera","Sheri","Sheroo","Shesha","Shihuken","Shintaht","Shirshocin","SHJO-J","Shokal","Shousran","Shumam","Shura","Shuria","SH-YZY","Sibe","Sibot","Sieh","Sifilar","Sigga","SI-I89","Silen","Sileperer","Simbeloud","Simela","Sinid","Sirekur","Sirkahri","Sirppala","Sirseshin","Siseide","Sist","Sitanan","Situner","Sivala","Siyi","Sizamod","SJJ-4F","SK42-F","SK7-G6","Skarkon","SKR-SP","S-KSWL","S-KU8B","Slays","S-LHPJ","SLVP-D","SL-YBS","S-MDYI","SN9-3Z","SN9S-N","SN-DZ6","SNFV-I","S-NJBB","SN-Q1T","Sobaseki","Sobenah","Soliara","Somouh","Sonama","SON-TW","Sooma","Soosat","Sortet","Sorzielang","Sosa","Sosala","Sosan","Sosh","Soshin","Sota","Sotrentaira","Sotrenzur","Soumi","SO-X5L","Soza","SPBS-6","SPLE-Y","SR-10Z","SR-4EK","S-R9J2","SR-KBB","SS-GED","Stacmon","Stayme","Stegette","Stetille","Stirht","Stou","Stoure","Straloin","S-U2VD","S-U8A4","Sucha","Sujarento","Sukirah","Suner","SUR-F7","Suroken","SV5-8N","SVB-RE","SV-K8J","SVM-3K","S-W8CF","SWBV-2","S-XZHU","SY-0AM","SY0W-2","Synchelle","SY-OLX","Syrikos","SY-UWN","SZ6-TA","T0DT-T","T-0JWP","T22-QI","T2-V8F","T-4H0B","T5ZI-S","T-67F8","T6GY-Y","T6T-BQ","T7-JNB","T-8GWA","T8H-66","T8T-RA","T-8UOF","T-945F","TA3T-3","TA9T-P","Tabbetzur","Tadadan","Taff","Tahli","Taisy","T-AKQZ","TAL1-3","Talidal","Tama","Tamekamur","Tamo","Tannakan","Tannolen","Tanoo","Tar","Tararan","Tarta","Tartoken","Taru","Tasabeshi","Tash-Murkon Prime","Tastela","Tasti","TCAG-3","TD-4XL","TDE4-H","TDP-T3","Tegheon","TEG-SD","Teimo","TEIZ-C","Tekaima","Telang","Tendhyes","Tennen","Teonusude","Teshi","Teshkat","Teskanen","TET3-B","Tew","TFA0-U","TFPT-U","T-GCGL","TG-Z23","Thakala","Thashkarai","Thasinaz","Thebeka","Thelan","Theruesse","Thiarer","T-HMWP","Tidacha","T-IDGH","Tierijev","Timeor","Timudan","Tintoh","T-IPZB","Tirbam","Tisot","Tividu","T-J6HT","TJM-JJ","T-K10W","TK-DLH","T-LIWS","TL-T9Z","T-M0FA","TM-0P2","TN25-J","T-NNJZ","TN-T7T","Todaki","Todeko","Todifrauan","Todrir","Tolle","Tollus","Tongofur","Toon","Torrinos","Torvi","Toshabia","Totkubad","Tourier","Toustain","TP7-KE","TP-APY","TPAR-G","TPG-DD","TP-RTO","T-Q2DD","TQ-RR8","TR07-S","Tralasa","Tratokard","Traun","Trer","TRKN-L","Trosquesere","Trossere","T-RPFU","Trytedald","TSG-NO","Tsuguwa","Tsukuras","Tsuruma","TTP-2B","Tukanas","Tunttaras","Tunudan","TU-O0T","Tuomuta","Turba","TU-RI6","Turnur","Tuuriainas","TU-Y2A","TV8-HS","Tvink","TVN-FM","TWJ-AW","TXJ-II","TXME-A","TXW-EI","TY2X-C","TYB-69","T-Z6J2","TZ-74M","Tzashrah","TZE-UB","T-ZFID","TZL-WT","TZN-2V","Tzvi","T-ZWA1","U0V6-T","U0W-DR","U104-3","U1-C18","U1TX-A","U1-VHY","U2-28D","U2-BJ2","U2U5-A","U-3FKL","U3K-4A","U3SQ-X","U4-Q2V","U4-V3J","U54-1L","U5-XW7","U65-CN","U69-YC","U6D-9A","U6-FCE","U6K-RG","U6R-F9","U79-JF","U93O-A","U9SE-N","U9U-TQ","UAAU-C","Uadelah","UAJ5-K","Ualkin","UALX-3","Uanim","Uanzin","UAV-1E","UAYL-F","UB5Z-3","Ubtes","UB-UQZ","UBX-CC","U-BXU9","UC3H-Y","UC-8XF","UCG4-B","Uchat","Uchomida","Uchoshi","UD-AOK","UDE-FX","Udianoor","UDVW-O","UD-VZW","Uedama","UEJX-G","Uemisaisen","Uemon","UEP0-A","UEPO-D","UER-TH","Uesuro","UEXO-Z","UF-KKH","U-FQ21","UFXF-C","UGR-J2","UG-UWZ","UH-9ZG","UHKL-N","Uhodoh","Uhtafal","U-HVIX","U-HYMT","U-HYZN","UI-8ZE","U-INPD","Uisper","Uitra","U-IVGH","U-JJEW","UJM-RD","UJXC-B","UJY-HE","Ukkalen","UK-SHL","Uktiad","UKYS-5","U-L4KS","UL-4ZW","UL-7I8","Ulerah","UMDQ-6","U-MFTL","UMI-KK","Uminas","Umokka","UM-Q7F","UM-SCG","UNAG-6","Unefsih","Unel","Unertek","UNJ-GX","Unkah","Unpas","UNV-3J","U-O2DA","UO9-YG","Uosusuokko","Uotila","U-OVFR","Uoyonen","Uphallant","Uphene","Uplingur","Upper Debyl","Upt","UQ9-3C","U-QMOA","UQ-PWD","U-QVWD","UQY-IK","UR-E46","UR-E6D","U-RELP","Urhinichi","Uriok","Urlen","Urnhard","Usi","U-SOH2","Usroh","Ussad","Usteli","Ustnia","UTDH-N","U-TJ7Y","UTKS-5","Utopia","Uttindar","UT-UZB","Uuhulanen","Uuna","Uusanen","U-UTU9","UVHO-F","U-W3WS","U-W436","UW-6MW","UW9B-F","U-WLT9","UY5A-D","UYG-YX","UYOC-1","UYU-VV","Uzigh","Uzistoon","UZ-QXW","V0DF-2","V0-H4L","V1V-6F","V1ZC-S","V-2GYS","V2-GZS","V2-VC2","V-3K7C","V3P-AZ","V-3U8T","V3X-L8","V-3YG7","V-4DBR","V4-L0X","V6-NY1","V7D-JD","V7-FB4","V7G-RL","V7-MID","V89M-R","V8W-QS","VA6-DR","Vaajaita","Vaankalen","Vaaralen","Vaere","VAF1-P","Vahunomi","Vaini","Vale","Valmu","Van","Vard","Varigne","Vasala","Vashkah","Vattuolen","Vaurent","Vay","VBFC-8","VBPT-T","VD-8QY","Vecamia","Vecodie","Vehan","Veisto","Vellaine","Venilen","VEQ-3V","Vestouve","Vevelonel","VE-W7O","Vey","Vezila","V-F6DQ","VF-FN6","VFK-IV","VG-6CH","VG-QW1","VH-9VO","VI2K-J","Vifrevaert","V-IH6B","Vilinnon","Villasen","Villore","Vilur","Vimeini","Vitrauze","Vittenyn","V-IUEL","Vivanier","VJ0-81","V-JCJS","VJ-NQP","VK6-EZ","VK-A5G","V-KDY2","VKI-T7","VKU-BG","VL3I-M","VL7-60","V-LDEJ","V-LEKM","VLGD-R","Vlillirier","V-MZW0","VNGJ-U","V-NL3K","VNPF-7","V-OJEN","V-OL61","VOL-MI","VORM-W","Vorsk","Vouskiaho","VPLL-N","VQE-CN","V-QXXK","VRH-H7","VR-YIQ","VR-YRV","V-S9YY","V-SEE6","VSIG-K","VSJ-PP","VT-G2P","VTGN-U","V-TN6Q","VUAC-Y","VULA-I","Vullat","Vuorrassi","VVB-QH","VVD-O6","VVO-R6","VV-VCR","VWES-Y","VW-PXL","V-X0KM","VX1-HV","V-XANH","VXO-OM","VY-866","VYJ-DA","Vylade","VYO-68","VZEG-B","W0X-MG","W-16DY","W2F-ZH","W2T-TR","W-3BSU","W3KK-R","W4C8-Q","W4E-IT","W-4FA9","W-4NUU","W5-205","W5-VBR","W-6GBI","W6P-7U","W6VP-Y","W6V-VM","W8O-19","W9-DID","W9-TFD","WAC-HW","Waira","Walvalin","Warouh","Waskisen","WB-AYY","WBLF-0","WBR5-R","W-CSFY","WD-VTV","WE3-BX","WE-KK2","Weld","WEQT-K","Weraroix","WF4C-8","WFC-MY","WFFE-4","W-FHWJ","WFYM-0","WH-2EZ","WHG2-7","WHI-61","WH-JCA","W-IIYI","WIO-OL","Wirashoda","Wirdalen","Wiskeber","WIW-X8","W-IX39","WJ-9YO","WJO0-G","WK2F-Y","W-KQPI","W-KXEX","WLAR-J","WLF-D3","WMBZ-U","W-MF6J","WMH-SO","W-MPTH","WNM-V0","WNS-7J","WO-AIJ","WO-GC0","WPR-EI","WPV-JN","W-Q233","WQH-4K","W-QN5X","WQY-IQ","W-RFUO","WRL4-2","WSK-1A","WT-2J9","WTIE-6","WU9-ZR","WU-FHQ","Wuos","W-UQA5","WUZ-WM","WV0D-1","WV-0R2","WVJU-4","WVMS-X","W-VXL9","WW-KGD","WW-OVQ","WX-6UX","W-XY4J","WY-9LL","WYF8-8","Wysalan","W-Z3HW","X0-6LH","X-0CKQ","X1E-OQ","X1-IZ0","X-1QGA","X1W-AL","X2-ZA5","X-31TE","X36Y-G","X-3AUU","X3FQ-W","X3-PBC","X40H-9","X-41DA","X445-5","X47L-Q","X4UV-Z","X4-WL0","X-4WZD","X5-0EM","X5O1-L","X5-UME","X6AB-Y","X6-J6R","X-6WC7","X-7BIX","X-7OMU","X7R-JW","X97D-W","X9V-15","X-9ZZR","XA5-TY","X-ARMF","XB-9U2","X-BV98","XCBK-X","XCF-8N","X-CFN6","X-CYNC","XCZ5-Y","XD-JW7","XD-TOV","XDTW-F","XEF6-Z","X-EHHD","XEN7-0","XFBE-T","XF-PWO","XF-TQL","XG-D1L","XGH-SH","X-HISR","XHQ-7V","XI-VUF","XJ-AG7","XJP-Y7","XKH-6O","X-KHRZ","XKM-DE","XKZ8-H","X-M2LR","XM-4L0","X-M9ON","XME-SW","XM-RMD","X-PQEX","XPUM-L","X-PYH5","XQP-9C","XQ-PXU","XQS-GZ","X-R3NM","XR-ZL7","XS-K1O","XSQ-TF","XSUD-1","XS-XAY","XT-1E0","XTJ-5Q","XT-R36","XTVZ-E","XU7-CH","XU-BF8","XUDX-A","XUPK-Z","XUW-3X","XV-8JQ","XV-MWG","XVV-21","XW2H-V","XW-2XP","XW-6TC","XW-JHT","XWY-YM","XX9-WV","XXZ-3W","XYY-IA","XY-ZCI","X-Z4DA","X-Z4JW","XZH-4X","XZ-SKZ","Y0-BVN","Y-0HVF","Y-1918","Y19P-1","Y1-UQ2","Y-1W01","Y2-6EA","Y-2ANO","Y2-I3W","Y2-QUV","Y4B-BQ","Y-4CFK","Y4-GQV","Y4OK-W","Y-4U62","Y5C-YD","Y5-E1U","Y5J-EU","Y6-9LF","Y-6B0E","Y6-HPG","Y-770C","Y7-XFD","Y-7XVJ","Y8K-5B","Y8R-XZ","Y9G-KS","Y9-MDG","YA0-XJ","Yadi","Yahyerer","YALR-F","Yanuel","YAP-TN","Yarebap","Yashunen","Yasud","YAW-7M","Y-BIPM","Y-C3EQ","Y-C4AL","YC-ANK","Y-CWQY","Y-DSSK","Y-DW5K","YE17-R","YE1-9S","Yebouz","Yeder","Yeeramoun","Yehaba","Yehnifi","Yekh","Y-EQ0C","Yezara","YF-6L1","YF-P4X","Y-FZ5N","YG-82V","YHEN-G","YHN-3K","YHP2-D","YI-8ZM","YI-GV6","Yiratal","Yishinoon","YJ3-UT","Y-JKJ8","Y-K50G","YKE4-3","YKSC-A","Ylandoki","YLS8-J","YMJG-4","Y-MPWL","Y-MSJN","YM-SRU","YN3-E3","Y-N4EF","Yoma","Y-OMTZ","Yona","Yong","Yooh","YOP-0T","Y-ORBJ","Youl","YP-J33","Y-PNRL","YPW-M4","Y-PZHM","YQB-22","YQM-P1","YQTK-R","YQX-7U","Y-RAW3","Yria","Yrmori","YRNJ-8","YRV-MZ","Yuhelia","Yulai","Y-UO9U","YUY-LM","Yuzier","Yvaeroure","YVA-F0","Yvangier","YVBE-E","Yvelet","Yveve","YV-FDG","YVSL-2","Y-W1Q3","Y-W6GF","YWS0-Z","YW-SYT","YX-0KH","YXIB-I","Y-XZA7","Y-YGMW","Y-YHZQ","YZ9-F6","YZ-LQL","YZS5-4","YZ-UKA","Y-ZXIO","Z0G-XG","Z0H2-4","Z0-TJW","Z182-R","Z19-B8","Z2-QQP","Z-2Y2Y","Z30S-A","Z3U-GI","Z3V-1W","Z-40CG","Z4-QLD","Z-6YQC","Z-7OK1","Z8-81T","Z-8Q65","Z9PP-H","ZA0L-U","Z-A8FS","ZA9-PY","Zahefeus","Zaid","Zaimeth","Zanka","Zarer","Zatamaka","Zatsyaki","ZAU-JW","Zaveral","Zayi","Zazamye","ZBP-TP","ZBY-0I","ZD1-Z2","ZD4-G9","ZDB-HT","Z-DDVJ","Z-DRIY","ZDYA-G","Zehru","Z-EKCY","Zemalu","Z-ENUD","Zephan","Zet","ZEZ1-9","Z-FET0","ZFJH-T","ZG8Q-N","Z-GY5S","Z-H2MA","ZH3-BS","ZH-GKG","Zhilshinou","ZH-KEV","Ziasad","ZID-LE","Zimmem","Zimse","Zinkon","Zinoo","Ziona","Ziriert","Zirsem","Zith","ZIU-EP","ZJ-5IS","ZJA-6U","ZJET-E","ZJG-7D","ZJ-GOU","ZJQH-S","ZJ-QOO","Z-K495","ZK-YQ3","ZKYV-W","ZLO3-V","Z-LO6I","ZLZ-1Z","Z-M5A1","ZM-DNR","Z-MO29","ZMV9-A","ZN0-SR","Z-N9IP","ZNF-OK","ZO-4AR","Zoohen","ZO-P5K","ZOPZ-6","Zorenyen","Zororzih","Zorrabed","ZO-YJZ","ZOYW-O","Z-PNIA","Z-QENW","ZQP-QV","ZQ-Z3Y","Z-R96X","Z-RFE3","ZS-2LT","ZS-PNI","Z-SR1I","ZT-L3S","ZT-LPU","ZTS-4D","ZUE-NS","ZU-MS3","Z-UZZN","ZV-72W","ZVN5-H","ZWM-BB","ZWV-GD","ZXA-V6","ZXB-VC","ZXC8-1","ZXIC-7","ZXI-K2","ZXJ-71","Z-XMUC","ZXOG-O","Z-XX2J","Z-Y7R7","Z-Y9C3","Z-YN5Y","ZZ5X-M","ZZK-VF","ZZZR-5","ZZ-ZWC"];
var dict = new Dict();
systems.forEach(dict.add, dict);
dict.compile();
var lineRegex = /\[ (\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2}) \] ([\w ]+) > (.*)/i;
var killmailRegex = /Kill: (.*) \((.*)\)/i;
var characters = Object.create(null);
var charDict = new Dict();
 
var processLine = function processLine(line, next) {
  if(line != undefined) {
    var result = lineRegex.exec(line);
    if(result) {
      var timestamp = result[1];
      var sender = result[2];
      var text = result[3];
      var requestList = [];
      var resolvedCharacters = {};
      var clear = false;
 
      if( sender === 'EVE System') {
        next();
        return;
      }
 
      if(characters[sender.toUpperCase()] === undefined) {
        requestList.push(sender);
      }
 
      var killmailResult = killmailRegex.exec(line);
      if(killmailResult) {
        var deadCharacter = killmailResult[1];
        var lostShip = killmailResult[2];
        requestList.push(deadCharacter);
 
        var getCharIDsComplete = function getCharIDsComplete() {
          next({time: Util.getTime(), type: 'reportKillmail', raw: line, 
                reporterId: characters[sender.toUpperCase()], reporterName: sender, 
                pilots: {deadCharacter: characters[deadCharacter.toUpperCase()]}, lostShip: lostShip});
        };
        if(requestList.length > 0) {
          getCharIDs(requestList, getCharIDsComplete);
        }
        else {
          getCharIDsComplete();
        }
      }
      else {
        var split = text.split("  ");
        var allSystems = [];
        split.forEach(function (element) {
          var system = dict.search(element).sort(function(a,b){return b.length - a.length}).shift();
          if(system !== undefined) {
            allSystems.push(system);
            if( element.toUpperCase() === system.toUpperCase() ) {
              return;
            }
          }
 
          if(characters[element.toUpperCase()] === undefined) {
            var searchResult = charDict.search(element).sort(function(a,b){return b.length - a.length}).shift();
            if( searchResult !== undefined && characters[searchResult.toUpperCase()] !== null ) {
              resolvedCharacters[searchResult] = characters[searchResult.toUpperCase()];
            }
            else if( /(clear|clr|empty)/.test(element) ) {
              clear = true;
            }
            else if( /^[A-Za-z0-9\-\_\' ]+$/.test(element) ) {
              requestList.push(element);
            }
          }
          else if( characters[element.toUpperCase()] !== null ) {
            resolvedCharacters[element] = characters[element.toUpperCase()];
          }
        });
        
        if( allSystems.length > 0 ) { 
          var type = (clear) ? 'reportClear' : 'reportHostile';
          if( requestList.length > 0 ) {
            var getCharIDsComplete = function getCharIDsComplete() {
              requestList.filter(function(c){return c !== sender && characters[c.toUpperCase()] != null;})
                .forEach(function(c){resolvedCharacters[c] = characters[c.toUpperCase()]});
              next({time: Util.getTime(), type: type, raw: line, clear: clear,
                reporterId: characters[sender.toUpperCase()], reporterName: sender,
                systems: allSystems, pilots: resolvedCharacters});
            };
            getCharIDs(requestList, getCharIDsComplete);
          }
          else {
            next({time: Util.getTime(), type: type, raw: line, clear: clear,
                  reporterId: characters[sender.toUpperCase()], reporterName: sender,
                  systems: allSystems, pilots: resolvedCharacters});
          }
        }
        else {
          next();
        }
      }
    }
    else {
      next();
    }
  }
};
