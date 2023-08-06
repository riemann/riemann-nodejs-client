var assert = require('assert');
var EventEmitter = require('events').EventEmitter;

var host = (process.env.RIEMANN_HOST ? process.env.RIEMANN_HOST : '127.0.0.1');

var client;
test("should connect to server", function(done) {
  client = require('riemann').createClient({host: host});
  assert(client instanceof EventEmitter);
  client.on('connect', done);
});


var server_down;
test("should fire error event", function(done) {
  server_down = require('riemann').createClient({host: host, port: 64500});
  server_down.on('error', function(e) {
    assert(e instanceof Error);
    done();
  });
});

test("should convert from metric to metricF", function(done) {
  var value = Math.random(100)*100;
  // Generate 'message' with 'metric' attribute
  client.Event({
    metric: value
  }).apply({
    send: function(message) {
      // Generate 'message_f' with 'metricF' attribute
      client.Event({
        metricF: value
      }).apply({
        send: function(message_f) {
          // Verify message lengths match
          assert.strictEqual(message.length, message_f.length);
          done();
        }
      });
    }
  });
});

test("should send an event as udp", function(done) {
  client.send(client.Event({
    service : 'hello_udp',
    metric  : Math.random(100)*100,
    tags    : ['bar'] }), client.udp);
  done();
});


test("should send an event as tcp", function(done) {
  var counter = 10;

  var listener;
  client.on('data', listener = function(data) {
    assert(data.ok);
    if (--counter === 0) {
      client.removeListener('data', listener);
      setTimeout(done, 100);
    }
  });

  for (var i = Number(counter); i >= 0; i--) {
    client.send(client.Event({
      service : 'hello_tcp_'+i,
      metric  : Math.random(100)*100,
      tags    : ['bar'] }), client.tcp);
  }

});

test("should send an event with custom attributes as tcp", function(done) {
  var counter = 10;

  var listener;
  client.on('data', listener = function(data) {
    assert(data.ok);
    if (--counter === 0) {
      client.removeListener('data', listener);
      setTimeout(done, 100);
    }
  });

  for (var i = Number(counter); i >= 0; i--) {
    client.send(client.Event({
      service : 'hello_tcp_'+i,
      attributes: [{key: "session", value: "123-456-789"},
                   {key: "metric_type", value: "random_number"}
                   ],
      metric  : Math.random(100)*100,
      tags    : ['bar'] }), client.tcp);
  }
});


test("should send a state as udp", function(done) {
  client.send(client.State({
    service: 'state_udp',
    state: 'ok'
  }), client.udp);
  done();
});


test("should send a state as tcp", function(done) {
  var counter = 10;

  var listener;
  client.on('data', listener = function(data) {
    assert(data.ok);
    if (--counter === 0) {
      client.removeListener('data', listener);
      setTimeout(done, 100);
    }
  });

  for (var i = Number(counter); i >= 0; i--) {
    client.send(client.State({
      service: 'state_tcp',
      state: 'ok'
    }), client.tcp);
  }
});


test("should query the server", function(done) {
  client.on('data', function(data) {
    assert(data.ok);
    assert(Array.isArray(data.events));
    setTimeout(done, 100);
  });
  client.send(client.Query({
    string: "true"
  }));

});


test("should disconnect from server", function(done) {
  client.once('disconnect', done);
  client.disconnect();
});

suite("serialization", function() {
  var serializer = require('../riemann/serializer');
  var eventObj   = {
    service    : "hello_tcp_123",
    ttl        : "" + Math.random(100)*100,    // should be a float
    attributes : [ {key: "foo", value: 123} ], // value should be a string
  };

  test("should not throw for type mismatch", function() {
    serializer.serializeEvent(eventObj);
  });

  test("should cast to proper type", function() {
    var event = serializer.deserializeEvent(serializer.serializeEvent(eventObj));
    assert(typeof event.ttl === 'number');
    assert(typeof event.attributes[0].value === 'string');
  });

});
