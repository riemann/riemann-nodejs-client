const assert = require('assert');

const host = (process.env.RIEMANN_HOST ? process.env.RIEMANN_HOST : '127.0.0.1');

let client;
test("[promisified client] should connect to server", async function() {
  const createClient = require('riemann').createClient;

  client = await createClient({host: host, returnPromise: true});
});

test("[promisified client] should fire error event", async function() {
  const createClient = require('riemann').createClient;

  try {
    await createClient({host: host, port: 64500, returnPromise: true});
  }
  catch(e) {
    assert(e instanceof Error);
  }
});

test("[promisified client] should send an event as udp", async function() {
  await client.send(client.Event({
    service : 'hello_udp',
    metric  : Math.random(100)*100,
    tags    : ['bar'] }), client.udp);
});

test("[promisified client] should send an event as tcp", async function() {
  let counter = 10;

  for (let i = Number(counter); i >= 0; i--) {
    const data = await client.send(client.Event({
      service : 'hello_tcp_'+i,
      metric  : Math.random(100)*100,
      tags    : ['bar'] }), client.tcp);

    assert(data.ok);
  }
});

test("[promisified client] should send an event with custom attributes as tcp", async function() {
  let counter = 10;

  for (let i = Number(counter); i >= 0; i--) {
    const data = await client.send(client.Event({
      service : 'hello_tcp_'+i,
      attributes: [{key: "session", value: "123-456-789"},
                   {key: "metric_type", value: "random_number"}
                   ],
      metric  : Math.random(100)*100,
      tags    : ['bar'] }), client.tcp);

    assert(data.ok);
  }
});

test("[promisified client] should send a state as udp", async function() {
  await client.send(client.State({
    service: 'state_udp',
    state: 'ok'
  }), client.udp);
});

test("[promisified client] should send a state as tcp", async function() {
  let counter = 10;

  for (let i = Number(counter); i >= 0; i--) {
    const data = await client.send(client.State({
      service: 'state_tcp',
      state: 'ok'
    }), client.tcp);

    assert(data.ok);
  }
});

test("[promisified client] should query the server", async function() {
  const data = await client.send(client.Query({
    string: "true"
  }));

  assert(data.ok);
  assert(Array.isArray(data.events));
});

test("[promisified client] should disconnect from server", async function() {
  await client.disconnect();
});
