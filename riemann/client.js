var assert   = require('assert');
var events   = require('events');
var inherits = require('util').inherits;
var hostname = require('os').hostname();

/* riemann uses Google Protocol Buffers
   as its wire transfer protocol. */
var Serializer = require('./serializer');


/* riemann communicates over UDP and TCP.
   UDP is way faster for sending events,
   we favor that whenever possible. */
var Socket = require('./socket');


var MAX_UDP_BUFFER_SIZE = 16384;


/* sets up a client connection to a Riemann server.
   options supports the following:
    - host (eg; my.riemannserver.biz)
    - port (eg; 5555 -- default) */
function Client(options, onConnect) {
  events.EventEmitter.call(this);

  options.host = options.host ? options.host : '127.0.0.1';
  options.port = options.port ? Number(options.port) : 5555;

  if (onConnect) { this.once('connect', onConnect); }

  var self = this;

  this.tcp = new Socket.tcpSocket(options);
  this.udp = new Socket.udpSocket(options);

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

  this.tcp.onMessage(function(message) {
    self.emit('data', Serializer.deserializeMessage(message));
  });

}

inherits(Client, events.EventEmitter);
exports.Client = Client;


/* Primary type of event we submit to the
   server, takes a key/value object of valid
   Event protocol buffer values. */
Client.prototype.Event = function(event) {
  // some friendly defaults for event,
  // in case they went missing.
  if (!event.host)  { event.host = hostname; }
  if (!event.time)  { event.time = new Date().getTime()/1000; }
  if (event.metric) { event.metricF = event.metric; }

  var self = this;
  return function() {
    // all events are wrapped in the Message type.
    var message = Serializer.serializeMessage({ events: [event] });

    // if we're sending a message that is larger than the max buffer
    // size of UDP, we should switch over to TCP.
    if (message.length >= MAX_UDP_BUFFER_SIZE) {
      self.tcp.send(message);
    } else {
      this.send(message);
    }
  };
};


/* sends an event to Riemann. Exepects an Event
   payload, and an optional (forced) transport (TCP or UDP). */
Client.prototype.send = function(payload, transport) {
  if (transport) {
    assert(transport === this.tcp || transport === this.udp, 'invalid transport provided.');
  } else {
    transport = this.udp;
  }
  payload.apply(transport);
};


/* disconnects our client */
Client.prototype.disconnect = function(onDisconnect) {
  if (onDisconnect) { this.once('disconnect', onDisconnect); }
  if (this.tcp) { this.tcp.socket.end(); }
  if (this.udp) { this.udp.socket.close(); }
};