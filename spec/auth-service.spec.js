var nats = require('nats'),
    nsc = require('nats-server-control'),
    bus = require('fruster-bus'),
    log = require('../log');
    authService = require('../auth-service');

describe('Auth service', function() {
  var server;  
  var busPort = Math.floor(Math.random() * 6000 + 2000);
  var busAddress = 'nats://localhost:' + busPort;

  beforeEach(function(done) {
    nsc.startServer(busPort)
      .then(function(oServer) { server = oServer; })
      .then(function() { return authService.start([busAddress]); })
      //.then(function() { return bus.connect([busAddress]); })
      .then(done)
      .catch(done.fail);
  });

  afterEach(function() {     
    if(server) {
      server.kill();      
    }
  });

  it('should login for web app', function(done) {              
    var reqId = 'a-req-id';

    bus.subscribe('user.validate-password', function(req) {
      return {
        status: 200,
        reqId: req.reqId
      }
    });

    bus
      .request('http.post.auth.login.web', { 
        reqId: reqId, 
        data: {
          username: 'joelsoderstrom', 
          password: 'ZlatansPonyTail'          
        }
      })
      .then(function(resp) {
        expect(resp.status).toBe(200);
        expect(resp.reqId).toBe(reqId);
        expect(resp.headers['Set-Cookie']).toBeDefined();
        done();
      })  
      .catch(done.fail);
  });

  it('should return 401 if invalid username or password', function(done) {              
    var reqId = 'a-req-id';

    bus.subscribe('user.validate-password', function(req) {
      return {
        status: 401,
        reqId: req.reqId
      };
    });

    bus
      .request('http.post.auth.login.web', { 
        reqId: reqId, 
        data: {
          username: 'joelsoderstrom', 
          password: 'ZlatansPonyTail'          
        }
      })
      .then(done.fail)  
      .catch(function(error) {
        expect(error.status).toBe(401);
        expect(error.reqId).toBe(reqId);
        expect(error.headers).toBeUndefined();
        done();
      });
  });

});