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

/* protobuf has a very strict type system, so ensure that only the
   whitelisted attributes get passed through */
var event_fields = [ 'time', 'state', 'service', 'host', 'description', 'tags', 'ttl', 'attributes', 'metric_f' ];
function _cleanEvent(event) {
  var serializableEvent = {};
  for (var i = 0; i < event_fields.length; i++) {
    if (event[event_fields[i]] !== undefined && event[event_fields[i]] !== null) {
      serializableEvent[event_fields[i]] = event[event_fields[i]];
    }
  }
  return serializableEvent;
}

exports.serializeMessage = function(message) {
  message.events = (message.events || []).map(_cleanEvent);
  return _serialize('Msg', message);
};

exports.deserializeMessage = function(message) {
  return _deserialize('Msg', message);
};
