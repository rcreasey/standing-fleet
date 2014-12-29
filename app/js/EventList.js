var EventList = {

  clear: function () {
    log('Clearing event list...');
    Data.events = [];
    Data.ui.events_list.empty();
  },

  addEvent: function (event) {
    if (event.alert) UI.showAlert(event);
    if (event.blink) UI.blinkTab(event.blink);

    EventList.preParse(event);
    Data.events.unshift(event);

    if (Data.events.length > Data.config.maxEvents) {
      Data.ui.events_list.children().last().remove();
      Data.events.pop();
    }

    EventList.renderEvent(event);
  },

  renderEvent: function (event) {
    var eventElement = $(Data.templates.event(event)),
      existingElement = Data.ui.events_list.find('.' + event.id);

    if (existingElement.length) {
      eventElement.insertAfter(existingElement);
    } else {
      Data.ui.events_list.prepend(
        $(Data.templates.event(event))
      );
    }

    UI.update_scrollables();
  },

  handleEvent: function (event) {
    if (event.type === 'memberjoined') {
      MemberList.sortAndRenderAll();
    } else if (event.type === 'memberleft') {
      MemberList.sortAndRenderAll();
    }
  },

  disableResponse: function (eventKey) {
    Data.ui.events_list.children().each(function () {
      if ($(this).data('key') === eventKey) {
        $(this).find('.response').remove();
      }
    });
  },

  preParse: function (event) {
    if (!event.id) event.id = 'internal-' + Math.floor(Math.random() * 10000)
    event.time = Util.getTime();
  },

  sort: function () {
    Data.events.sort(function (event1, event2) {
      if (event1.time > event2.time) return -1;
      if (event1.time < event2.time) return 1;
      return 0;
    });
  },

  eventResponseClick: function (key, response) {
    Server.eventResponse(key, response, function (error, data) {
      if (error) return handleError(error);

      EventList.disableResponse(key);

      UI.showAlert({
        type: 'info',
        text: 'Your response has been registered'
      });
    });
  },

  alertClick: function (type, id) {
    if (type === 'foo') {
      UI.tabClick('events');
    }
  }
};
