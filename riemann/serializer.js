/* initialize our protobuf schema,
   and cache it in memory. */
var protobuf = require('protobufjs');
var buf = protobuf.loadProtoFile(__dirname + '/proto/proto.proto').build();

function _serialize(type, value) {
  return new buf[type](value).encode().toBuffer();
}

function _deserialize(type, value) {
  return buf[type].decode(value);
}

/* serialization support for all
   known Riemann protobuf types. */

exports.serializeEvent = function(event) {
  return _serialize('Event', event);
};

exports.deserializeEvent = function(event) {
  return _deserialize('Event', event);
};

exports.serializeMessage = function(message) {
  return _serialize('Msg', message);
};

exports.deserializeMessage = function(message) {
  return _deserialize('Msg', message);
};

exports.serializeQuery = function(query) {
  return _serialize('Query', query);
};

exports.deserializeQuery = function(query) {
  return _deserialize('Query', query);
};

exports.serializeState = function(state) {
  return _serialize('State', state);
};

exports.deserializeState = function(state) {
  return _deserialize('State', state);
};
