const assert = require('assert');

let client;
test("[promisified client] should connect to server", function(done) {
  require('riemann').createPromisifiedClient()
    .then((c) => { client = c; done(); });
});

let server_down;
test("[promisified client] should fire error event", function(done) {
  server_down = require('riemann').createPromisifiedClient({port: 64500})
    .catch((e) => {
      assert(e instanceof Error);
      done();
    });
});

test("[promisified client] should send an event as udp", function(done) {
  client.send(client.Event({
    service : 'hello_udp',
    metric  : Math.random(100)*100,
    tags    : ['bar'] }), client.udp).then(done);
});

test("[promisified client] should send an event as tcp", function(done) {
  let counter = 10;

  function listener(data) {
    assert(data.ok);
    if (--counter === 0) {
      setTimeout(done, 100);
    }
  };

  for (let i = Number(counter); i >= 0; i--) {
    client.send(client.Event({
      service : 'hello_tcp_'+i,
      metric  : Math.random(100)*100,
      tags    : ['bar'] }), client.tcp).then(listener);
  }

});

test("[promisified client] should send an event with custom attributes as tcp", function(done) {
  let counter = 10;

  function listener(data) {
    assert(data.ok);
    if (--counter === 0) {
      setTimeout(done, 100);
    }
  };

  for (var i = Number(counter); i >= 0; i--) {
    client.send(client.Event({
      service : 'hello_tcp_'+i,
      attributes: [{key: "session", value: "123-456-789"},
                   {key: "metric_type", value: "random_number"}
                   ],
      metric  : Math.random(100)*100,
      tags    : ['bar'] }), client.tcp).then(listener);
  }
});

test("[promisified client] should send a state as udp", function(done) {
  client.send(client.State({
    service: 'state_udp',
    state: 'ok'
  }), client.udp).then(done);
});

test("[promisified client] should send a state as tcp", function(done) {
  let counter = 10;

  function listener(data) {
    assert(data.ok);
    if (--counter === 0) {
      setTimeout(done, 100);
    }
  };

  for (var i = Number(counter); i >= 0; i--) {
    client.send(client.State({
      service: 'state_tcp',
      state: 'ok'
    }), client.tcp).then(listener);
  }
});

test("[promisified client] should query the server", function(done) {
  client.send(client.Query({
    string: "true"
  })).then(function(data) {
    assert(data.ok);
    assert(Array.isArray(data.events));
    setTimeout(done, 100);
  });

});

test("[promisified client] should disconnect from server", function(done) {
  client.disconnect().then(done);
});
