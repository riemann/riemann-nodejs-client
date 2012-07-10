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

  // state machine for stream recv
  this._socketState     = 1;
  this._lenBufferOffset = 0;
  this._lenBuffer       = new Buffer(4);
  this._payloadBuffer   = null;
  this._payloadOffset   = 0;
}


function _getResponseLength(chunk) {
  return (chunk[0] << 24) +
         (chunk[1] << 16) +
         (chunk[2] << 8)  +
         (chunk[3]);
}


tcpSocket.prototype.onMessage = function(emit) {
  var self = this;
  this.socket.on('data', function(chunk) {
    var chunkOffset = 0;
    while (chunkOffset < chunk.length) {
      switch (self._socketState) {

        case 1: // parsing length of packet
          if (chunk.length+self._lenBufferOffset >= 4) {
            chunkOffset += 4-self._lenBufferOffset;
            chunk.copy(self._lenBuffer, self._lenBufferOffset, 0, chunkOffset);
            self._payloadBuffer = new Buffer(_getResponseLength(self._lenBuffer));
            self._socketState = 2;
            self._lenBufferOffset = 0; // re-init
          } else {
            chunk.copy(self._lenBuffer, self._lenBufferOffset);
            self._lenBufferOffset += chunk.length;
          }
          break;

        case 2: // copy data and emit
          var copyLen = Math.min(self._payloadBuffer.length, chunk.length-chunkOffset);
          chunk.copy(self._payloadBuffer, self._payloadOffset, chunkOffset, chunkOffset+copyLen);
          self._payloadOffset += copyLen;
          chunkOffset += copyLen;
          if (self._payloadBuffer.length === self._payloadOffset) {
            emit(self._payloadBuffer);
            self._socketState     = 1;
            self._lenBufferOffset = 0;
            self._payloadBuffer   = null;
            self._payloadOffset   = 0;
          }
          break;
      }
    }
  });
};


/* Before each message is a 4 byte network endian length header */
tcpSocket.prototype.send = function(payload) {
  assert(Buffer.isBuffer(payload));
  var len = payload.length;
  var packet = new Buffer(len + 4);
  packet[0] = len >>> 24 & 0xFF;
  packet[1] = len >>> 16 & 0xFF;
  packet[2] = len >>> 8  & 0xFF;
  packet[3] = len & 0xFF;
  payload.copy(packet, 4, 0);
  this.socket.write(packet);
};
