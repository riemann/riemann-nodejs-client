var Client = require('./riemann/client').Client;
const e2p = require('event-to-promise');

// convenience methods, how convenient.

exports.createClient = function(options, onConnect) {
  return new Client(options, onConnect);
};

exports.createPromisifiedClient = function(options) {
  try {
    const client = new Client(options);
    return e2p(client, 'connect').then(() => client);
  }
  catch(err) {
    return Promise.reject(err);
  }
};
