/* initialize our protobuf schema,
   and cache it in memory. */
var riemannSchema;
if (!riemannSchema) {
  var protobuf  = require('protocol-buffers');
  var readFile  = require('fs').readFileSync;
  riemannSchema = protobuf(readFile(__dirname+'/proto/proto.proto'));
}

function _serialize(type, value) {
  return riemannSchema[type].encode(value);
}

function _deserialize(type, value) {
  return riemannSchema[type].decode(value);
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
