/* initialize our protobuf schema,
   and cache it in memory. */
var riemannSchema;
if (!riemannSchema) {
  var ProtoBuf  = require('protobufjs');
  var builder = ProtoBuf.loadProtoFile(__dirname+'/proto/proto.proto');
  var riemannSchema = {
    'Event': builder.build('Event'),
    'Msg': builder.build('Msg'),
    'Query': builder.build('Query'),
    'State': builder.build('State')
  };
}

function _serialize(type, value) {
  return new riemannSchema[type](value).toBuffer();
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
