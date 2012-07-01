var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var util = require('util');


var client;
test("should connect to server", function(done) {
  client = require('riemann').createClient();
  assert(client instanceof EventEmitter);
  client.on('connect', done);
});


test("should send an event as udp", function(done) {
  client.send(client.Event({
    service : 'hello_udp',
    metric  : Math.random(100)*100,
    tags    : ['bar'] }), client.udp);
  done();
});


test("should send an event as tcp", function(done) {
  client.once('data', function(data) { done(); });
  client.send(client.Event({
    service : 'hello_tcp',
    metric  : Math.random(100)*100,
    tags    : ['bar'] }), client.tcp);
});


test("should send a state as udp", function(done) {
  client.send(client.State({
    service: 'state_udp',
    state: 'ok'
  }), client.udp);
  done();
});


test("should send a state as tcp", function(done) {
  client.once('data', function(data) { done(); });
  client.send(client.State({
    service: 'state_tcp',
    state: 'ok'
  }), client.tcp);
});


test("should disconnect from server", function(done) {
  client.once('disconnect', done);
  client.disconnect();
});
