var Client = require('./riemann/client').Client;

// convenience method, how convenient.
exports.createClient = function(options, onConnect) {
  return new Client(options, onConnect);
};