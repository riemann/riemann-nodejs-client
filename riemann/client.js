var assert   = require('assert');
var events   = require('events');
var inherits = require('util').inherits;
var hostname = require('os').hostname();
const e2p    = require('event-to-promise');

/* riemann uses Google Protocol Buffers
   as its wire transfer protocol. */
var Serializer = require('./serializer');


/* riemann communicates over UDP and TCP.
   UDP is way faster for sending events,
   we favor that whenever possible. */
var Socket = require('./socket');


/* allows to disconnect all those already
   unnecessary 'data', 'sent' and 'error' handlers. */
function _e2p(emitter, event, options) {
  let p = e2p(emitter, event, options);

  return p.then(() => {
    p.cancel();
    return p;
  })
  .catch(err => {
    p.cancel();
    throw err;
  });
}


var MAX_UDP_BUFFER_SIZE = 16384;
function _sendMessage(contents, transport) {
  var self = this;
  return function() {
    // all events are wrapped in the Message type.
    var message = Serializer.serializeMessage(contents);
    let t;

    // if an explict transport is specified via code,
    // at definition of this message, we trust it.
    if (transport) {
      t = transport;

    // if we're sending a message that is larger than the max buffer
    // size of UDP, we should switch over to TCP.
    } else if (message.length >= MAX_UDP_BUFFER_SIZE) {
      t = self.tcp;

    // utilize whatever transport this message is applied to,
    // by caller.
    } else {
      t = this;
    }

    try {
      if (self.returnPromise) {
        return _e2p(self, t.promiseResolutionEvent);
      }
    }
    finally {
      t.send(message);
    }
  };
}


/* some friendly defaults for event,
   in case they went missing. */
function _defaultValues(payload) {
  if (!payload.host)  { payload.host = hostname; }
  if (!payload.time)  { payload.time = Math.round(new Date().getTime()/1000); }
  if (typeof payload.metric !== "undefined" && payload.metric !== null) {
    // protobufjs requires this to be camel case
    payload.metricF = payload.metric;
    delete payload.metric;
  }
  return payload;
}


/* sets up a client connection to a Riemann server.
   options supports the following:
    - host (eg; my.riemannserver.biz)
    - port (eg; 5555 -- default) */
function Client(options, onConnect) {
  events.EventEmitter.call(this);
  if (!options) { options = {}; }
  options.host = options.host ? options.host : '127.0.0.1';
  options.port = options.port ? Number(options.port) : 5555;

  if (onConnect) { this.once('connect', onConnect); }

  var self = this;

  this.tcp = new Socket.tcpSocket(options);
  this.udp = new Socket.udpSocket(options);
  this.tcp.promiseResolutionEvent = 'data';
  this.udp.promiseResolutionEvent = 'sent';
  this.returnPromise = options.returnPromise;

  // monitor both close events, and proxy
  // it as a single disconnect event.
  var _closeAcks = 0;
  var monitorClose = function() {
    ++_closeAcks;
    return function() {
      if (--_closeAcks === 0) { self.emit('disconnect'); }
    };
  };
  this.tcp.socket.on('close', monitorClose());
  this.udp.socket.on('close', monitorClose());

  // proxy the TCP connect event.
  this.tcp.socket.on('connect', function() { self.emit('connect'); });

  // proxy the UDP sent event.
  this.udp.socket.on('sent', function() { self.emit('sent'); });

  // proxy errors from TCP and UDP
  this.tcp.socket.on('error', function(error) { self.emit('error', error); });
  this.udp.socket.on('error', function(error) { self.emit('error', error); });

  this.tcp.onMessage(function(message) {
    self.emit('data', Serializer.deserializeMessage(message));
  });

}

inherits(Client, events.EventEmitter);
exports.Client = Client;


/* Submits an Event to the server.
   takes a key/value object of valid
   Event protocol buffer values. */
Client.prototype.Event = function(event) {
  event = _defaultValues(event);
  return _sendMessage.call(this, { events: [event] });
};


/* Submits a State to the server.
   takes a key/value object of valid
   State protocol buffer values. */
Client.prototype.State = function(state) {
  state = _defaultValues(state);
  return _sendMessage.call(this, { states: [state] });
};


/* Submits a Query to the server.
  takes a key/value object of valid
  Query protocol buffer values. */
Client.prototype.Query = function(query) {
  return _sendMessage.call(this, { query: query }, this.tcp);
};


/* sends a payload to Riemann. Exepects any valid payload type
   (eg: Event, State, Query...) and an optional (requested, not guaranteed)
   transport (TCP or UDP). */
Client.prototype.send = function(payload, transport) {
  if (transport) {
    assert(transport === this.tcp || transport === this.udp, 'invalid transport provided.');
  } else {
    transport = this.udp;
  }

  return payload.apply(transport);
};


/* disconnects our client */
Client.prototype.disconnect = function(onDisconnect) {
  try {
    if (this.returnPromise) {
      return _e2p(this, 'disconnect');
    }
  }
  finally {
    if (this.tcp) { this.tcp.socket.end(); }
    if (this.udp) { this.udp.socket.close(); }
    if (onDisconnect) {
      this.once('disconnect', onDisconnect);
    }
  }
};
