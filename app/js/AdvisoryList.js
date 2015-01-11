var AdvisoryList = {
  types: ['Wormhole Detected', 
  'Hostile Cloaked',
  'Hostile Logged Off',
  'Undock Camped',
  'Gate Bubbled'], 
  
  clear: function () {
    log('Clearing advisory list...');
    Data.advisories = {};
  },
  
  lookup: function(systemId) {    
    var advisories = $.map(AdvisoryList.types, function(t) {
      var a = {type: t, systemId: systemId}
      
      if ($.inArray(t, Data.advisories[systemId]) !== -1) a.present = true;
      
      return a;
    })    
    return advisories;
  },
  
  addAdvisory: function(advisory) {
    if (!(Data.advisories[advisory.systemId] instanceof Array)) Data.advisories[advisory.systemId] = new Array;
    Data.advisories[advisory.systemId].push(advisory.type);
    
    $.unique(Data.advisories[advisory.systemId]);
  },
  
  clearAdvisory: function (advisory) {
    Data.advisories[advisory.systemId] = $.grep(Data.advisories[advisory.systemId], function(t) { return t != advisory.type });
  }, 

}
