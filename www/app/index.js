'use strict';

function noop() {}

function bindEvents(thisArg, events) {
   Object.keys(events).forEach(function (selector) {
        Object.keys(events[selector]).forEach(function (event) {
            var handler = events[selector][event].bind(thisArg);
            if('document' === selector) {
                document.addEventListener(event, handler, false);
            } else if ('window' === selector) {
                window.addEventListener(event, handler, false);
            } else {
                document.querySelectorAll(selector).forEach(function (dom) {
                    dom.addEventListener(event, handler, false);
                });
            }
        });
    }); // all events bound
}

function f(name, params) {
  params = Array.prototype.slice.call(arguments, 1, arguments.length);
  return name + '(' + params.join(', ') + ')';
}

var IS_CORDOVA = !!window.cordova;

var app = {
  URL_ERUV: 'http://bethisraelmalden.org/api/eruv/status.php?callback=?',
  URL_EVENTS: 'http://bethisraelmalden.org/api/calendar/upcoming.php?callback=?',

  // options
  DATA_KEY: 'org.metaist.bim.data',
  store: null,
  options: {
    debug: true
  },

  // internal
  eruv: {
    URL_PREFIX: 'https://twitter.com/maldeneruv/',
    isUpdated: false,
    dt: null,
    id: '',
    status: 'loading',
    text: ''
  },

  // DOM
  // TODO

  init: function () {
    bindEvents(this, {
      'document': {'deviceready': this.ready},
      'form input': {'change': this.change}
    });

    if(!IS_CORDOVA) {
      this.options.debug && console.log('NOT cordova');
      bindEvents(this, {'window': {'load': this.ready}});
    }

    return this;
  },

  ready: function () {
    // Store DOM nodes
    // TODO
    return this.fetch();
  },

  change: function () {
    // TODO: check values and update options

    if (IS_CORDOVA) {
      this.store.store(noop, noop, this.DATA_KEY, this.options);
    }//end if: options stored
    return this;
  },

  fetch: function () {
    $.getJSON(this.URL_ERUV).done(function (tweets) {
      var tweet = tweets[0];
      var dtNow = moment();
      var dtPost = moment(tweet.created_at);
      var text = tweet.text.replace('\u00a0', ' '); // scrub weird text
      var status = text.slice(0, text.indexOf(' ') - 1).toLowerCase();
      var isUpdated = dtNow.diff(dtPost, 'days') <= 1;

      Object.assign(this.eruv, {
        isUpdated: isUpdated,
        dt: dtPost,
        id: tweet.id_str,
        status: status,
        text: text
      });
      this.render();
    }.bind(this));


    $.getJSON(this.URL_EVENTS).done(function(data) {
      var events = [],
        tmp_day = '',
        tmp_events = [];

      $.each(data.events, function (idx, item) {
        var t = moment(item.when),
          day = t.format('dddd, MMMM Do');

        if (day != tmp_day) { // new day
          if (tmp_day) { events.push({day: tmp_day, events: tmp_events}); }
          tmp_day = day;
          tmp_events = [];
        }//end if

        tmp_events.push({when: t.format('hh:mma'), title: item.title});
      });//end $.each

      if (tmp_day) { events.push({day: tmp_day, events: tmp_events}); }//end if

      $('#upcoming')
        .find('.loading').remove().end()
        .render(events);
    });//end $.getJSON



    return this;
  },

  render: function () {
    var eruv = this.eruv;
    if(eruv.isUpdated) {
      $('#card-eruv')
        .find('.status').set({'text': 'arrow_' + eruv.status + 'ward'}).end()
        .find('.text').set({'text': eruv.text}).end()
        .find('.link').set({'attr:href': eruv.URL_PREFIX + eruv.id}).end()
    } else {
      $('#card-eruv')
        .find('.status').set({'text': 'not_interested'}).end()
        .find('.text').set({'text': 'No Update'}).end()
        .find('.link').set({'attr:href': URL_PREFIX}).end()
    }//end if: rendered eruv




    return this;
  }
};

app.init();
