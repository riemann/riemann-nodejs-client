var protobuf = require('protobufjs');
var path = require('path');

/* initialize our protobuf schema,
   and cache it in memory. */
var riemannSchema;
if (!riemannSchema) {
  schemaLoad();
}

function schemaLoad() {
  return new Promise((resolve, reject) => {
    if (riemannSchema) {
      resolve();
    }

    protobuf.load(path.join(__dirname, '/proto/proto.proto'), (err, root) => {
      if (err) {
        reject(err);
      }

      // Pull the message type out.
      riemannSchema = root;
      resolve();
    });
  });
}

exports.schemaLoad = schemaLoad;

function _serialize(type, value) {
  var messageType = riemannSchema.lookupType(type);

  // https://www.npmjs.com/package/protobufjs#valid-message
  var errorString = messageType.verify(value);
  var message;

  // Using create is faster, so only fall back to fromObject in worst case.
  if (errorString) {
    message = messageType.fromObject(value);
  } else {
    message = messageType.create(value);
  }

  return messageType.encode(message).finish();
}

function _deserialize(type, value) {
  var messageType = riemannSchema.lookupType(type);
  var buffer = Buffer.from(value, 'binary');

  return messageType.decode(buffer);
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
