var p = require('process')
var Client = require('./riemann/client').Client;
const e2p = require('event-to-promise');

var serializer = require('./riemann/serializer')

// convenience method, how convenient.
var createClient = function (options, onConnect) {
  if (options.returnPromise) {
    try {
      const client = new Client(options);
      return e2p(client, 'connect').then(() => client);
    }
    catch (err) {
      return Promise.reject(err);
    }
  }
  else {
    return new Client(options, onConnect);
  }
};

exports.createClient = createClient

var errors = {}

function push_error (e) {
  var k = e.toString()
  console.log(k)
  if (errors[k] === undefined) { errors[k] = 0 }
  errors[k]++
}

var iter = 0

serializer.schemaLoad().then(() => {
  setInterval(() => {
    iter++
    var mu = p.memoryUsage()

    if (iter % 10 === 0) console.log({ rss: mu.rss / 1024 / 1024, iter, errors })

    try {
      // var c = new Client()
      var opts = {
        host: '127.0.0.1',
        port: '12003',
      }

      // var c = new Client(opts, _ => undefined)
      var c = createClient(
        { host: '127.0.0.1', port: '12003' },
        _ => {
          c.on('error', push_error)
          setTimeout(() => {
            try {
              c.send(c.Event({ service: 'stub' }), c.tcp)
            } catch (reason) {
              push_error(reason)
            }
          }, 50)
        }
      )
      // c.on('connect', function () {
      //   try {
      //     (() => undefined)()
      //     // console.log('send event...')
      //     // c.send(c.Event({
      //     //   service: 'oops',
      //     // }))
      //     // c.disconnect()
      //     delete c
      //   } catch (reason) {
      //     push_error(reason)
      //   }
      // })
      // var c = new Cl() // { rss: 28.91015625, iter: 28000 } (no output but every 1k)
    } catch (reason) {
      push_error(reason)
    }
  }, 1000)
})
