var Client = require('./riemann/client').Client;
const e2p = require('event-to-promise');

// convenience method, how convenient.
exports.createClient = function(options, onConnect) {
  if (options.returnPromise) {
    try {
      const client = new Client(options);
      return e2p(client, 'connect').then(() => client);
    }
    catch(err) {
      return Promise.reject(err);
    }
  }
  else {
    return new Client(options, onConnect);
  }
};
