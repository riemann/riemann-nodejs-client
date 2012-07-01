var assert  = require('assert');
var udp     = require('dgram');
var tcp     = require('net');


exports.udpSocket = udpSocket;
function udpSocket(options) {
  this.socket = udp.createSocket('udp4');
  this.options = options;
}


udpSocket.prototype.send = function(payload) {
  assert(Buffer.isBuffer(payload));
  this.socket.send(payload, 0, payload.length, this.options.port, this.options.host);
};


exports.tcpSocket = tcpSocket;
function tcpSocket(options) {
  this.socket = new tcp.Socket();
  this.socket.connect(options.port, options.host);
  this.socket.setKeepAlive(true, 0);
  this.socket.setNoDelay(true);
  this.options = options;
}


// TODO: this will probably not work well if
// the frames start splitting...FIXME!
tcpSocket.prototype.onMessage = function(handler) {
  this.socket.on('data', function(chunk) {
    var len = (chunk[0] << 24) +
              (chunk[1] << 16) +
              (chunk[2] << 8);
    var payload = new Buffer(len);
    chunk.copy(payload, 0, 4);
    handler(payload);
  });
};


/* Before each message is a 4 byte network endian length header */
tcpSocket.prototype.send = function(payload) {
  assert(Buffer.isBuffer(payload));
  var len = payload.length;
  var packet = new Buffer(len + 4);
  packet[0] = len >>> 24;
  packet[1] = len >>> 16;
  packet[2] = len >>> 8;
  packet[3] = len &   255;
  payload.copy(packet, 4, 0);
  this.socket.write(packet);
};
