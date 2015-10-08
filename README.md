# [Riemann](http://aphyr.github.com/riemann/) Node.js Client

because you should be monitoring all of those [non-blocking buffet plates.](http://www.infinitelooper.com/?v=-sfZqL4Plxc&p=n#/242;267)

## Prerequisites

Riemann uses [Google Protocol Buffers](https://github.com/google/protobuf),
so please make sure it's installed beforehand.

### Ubuntu/Debian via apt

```sh
apt-get install libprotobuf-dev
```

### RHEL/Centos via yum

```sh
yum install protobuf-devel
```

### Mac OS via homebrew

```sh
brew install protobuf
```

### Windows

https://github.com/fuwaneko/node-protobuf#windows

## Installation

```sh
npm install riemann
```

## Getting Started

first things first, we'll want to establish a new client:

```js
var client = require('riemann').createClient({
  host: 'some.riemann.server',
  port: 5555
});

client.on('connect', function() {
  console.log('connected!');
});
```

Just like [Riemann ruby client](https://github.com/aphyr/riemann-ruby-client), the client sends small events over UDP, by default. TCP is used for queries, and large events. There is no acknowledgement of UDP packets, but they are roughly an order of magnitude faster than TCP. We assume both TCP and UDP are listening to the same port.

sending events is easy (see [list of valid event properties](http://aphyr.github.com/riemann/concepts.html)):

```js
client.send(client.Event({
  service: 'buffet_plates',
  metric:  252.2,
  tags:    ['nonblocking']
}));
```

If you wanted to send that message over TCP and receive an acknowledgement, you can specify the transport, explicitly:

```js
client.on('data', function(ack) {
  console.log('got it!');
});

client.send(client.Event({
  service: 'buffet_plates',
  metric:  252.2,
  tags:    ['nonblocking']
}), client.tcp);
```

You can also send events with custom attributes:

```js
client.send(client.Event({
  service: 'buffet_plates',
  metric: 150,
  attributes: [{key: "sessionID", value: "000-001-165"}],
  tags: ['nonblocking']
}), client.tcp);
```


When you're done monitoring, disconnect:

```js
client.on('disconnect', function(){
  console.log('disconnected!');
});
client.disconnect();
```


## Contributing

Contributing is easy, just send me a pull request. Please take a look at the project issues, to see how you can help. Here are some helpful tips:

- install the developer dependencies using `npm install --dev`
- please add tests. I'm using [Mocha](http://visionmedia.github.com/mocha/) as a test runner, you can run the tests using `npm test`
- please check your syntax with the included jshint configuration using `npm run-script lint`. It shouldn't report any errors.
