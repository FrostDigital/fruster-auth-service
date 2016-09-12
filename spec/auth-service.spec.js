var nats = require('nats'),
    nsc = require('nats-server-control'),
    bus = require('fruster-bus'),
    cookie = require('cookie'),
    log = require('../log'),
    jwt = require('../jwt'),
    authService = require('../auth-service'),
    conf = require('../conf'),
    uuid = require('uuid'),
    errors = require('../errors'),
    mongo = require('mongodb-bluebird');

    //embeddedMongo = require('embedded-mongo-spec');

describe('Auth service', () => {
  var natsServer;  
  //var mongoPort = Math.floor(Math.random() * 6000 + 2000);
  var busPort, busAddress;
  var mongoUrl = 'mongodb://localhost:27017/auth-service-test';
  var db, refreshTokenColl;

  beforeAll(done => {
    //embeddedMongo.open(mongoPort)
    mongo.connect(mongoUrl).then(oDb => {
      db = oDb;
      refreshTokenColl = db.collection(conf.refreshTokenCollection);
      done();
    })
    .catch(done.fail);
  });

  beforeEach(done => {
    busPort = Math.floor(Math.random() * 6000 + 2000);
    busAddress = 'nats://localhost:' + busPort;

    nsc.startServer(busPort)
      .then(oServer => { natsServer = oServer; })
      .then(x => authService.start([busAddress], mongoUrl))
      .then(done)
      .catch(done.fail);
  });

  afterEach(() => {     
    if(natsServer) {
      natsServer.kill();      
    }
  });

  afterAll(() => {
    db.dropCollection(conf.refreshTokenCollection);    
  });

  describe('Web login', () => {

    it('should login and return JWT as cookie', done => {              
      var reqId = 'a-req-id';
      var username = 'joelsoderstrom';
      var password = 'ZlatansPonyTail';

      bus.subscribe('user-service.validate-password', req => {
        expect(req.data.username).toBe(username);
        expect(req.data.password).toBe(password);

        return {
          status: 200,
          data: {
            'id': 'id',
            'firstName': 'firstName',
            'lastName': 'lastName',
            'email': 'email'
          }
        };
      });

      bus
        .request('http.post.auth.web', { 
          reqId: reqId, 
          data: {
            username: username, 
            password: password          
          }
        })
        .then(resp => {
          expect(resp.status).toBe(200);
          expect(resp.reqId).toBe(reqId);
          expect(resp.headers['Set-Cookie']).toBeDefined();

          var jwtCookie = cookie.parse(resp.headers['Set-Cookie']).jwt;
          var decodedJWT = jwt.decode(jwtCookie);

          expect(decodedJWT.id).toBe('id');
          expect(decodedJWT.firstName).toBe('firstName');
          expect(decodedJWT.lastName).toBe('lastName');
          expect(decodedJWT.email).toBe('email');
          expect(decodedJWT.exp).toBeDefined();

          done();
        })  
        .catch(done.fail);
    });

    it('should return 401 if invalid username or password', done => {              
      var reqId = 'a-req-id';

      bus.subscribe('user-service.validate-password', req => {
        return {
          status: 401
        };
      });

      bus
        .request('http.post.auth.web', { 
          reqId: reqId, 
          data: {
            username: 'joelsoderstrom', 
            password: 'ZlatansPonyTail'          
          }
        })
        .then(done.fail)  
        .catch(error => {
          expect(error.status).toBe(401);
          expect(error.reqId).toBe(reqId);
          expect(error.headers).toBeUndefined();
          done();
        });
    });

  });


  describe('App login', () => {

    it('should login and return access and refreshtoken in body', done => {              
      var reqId = 'a-req-id';

      bus.subscribe('user-service.validate-password', req => {
        return {
          status: 200,
          reqId: req.reqId,
          data: {
            'id': 'id',
            'firstName': 'firstName',
            'lastName': 'lastName',
            'email': 'email'
          }
        };
      });

      bus
        .request('http.post.auth.app', { 
          reqId: reqId, 
          data: {
            username: 'joelsoderstrom', 
            password: 'ZlatansPonyTail'          
          }
        })
        .then(function(resp) {
          expect(resp.status).toBe(200);
          expect(resp.reqId).toBe(reqId);
          expect(resp.data.accessToken).toBeDefined();
          expect(resp.data.refreshToken).toBeDefined();
          expect(resp.data.profile.id).toBe('id');
          expect(resp.data.profile.firstName).toBe('firstName');
          
          var decodedJWT = jwt.decode(resp.data.accessToken);

          expect(decodedJWT.id).toBe('id');
          expect(decodedJWT.firstName).toBe('firstName');
          expect(decodedJWT.lastName).toBe('lastName');
          expect(decodedJWT.email).toBe('email');

          return refreshTokenColl.findOne({token: resp.data.refreshToken}).then(function(token) {
            expect(token.userId).toBe('id');
            expect(token.expires).toBeDefined();
            expect(token.expired).toBe(false);

            done();
          });        
        })          
        .catch(done.fail);
    });

    it('should return 401 if invalid username or password', done => {              
      var reqId = 'a-req-id';

      bus.subscribe('user-service.validate-password', req => {
        return {
          status: 401,
          reqId: req.reqId
        };
      });

      bus
        .request('http.post.auth.app', { 
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
          done();
        });
    });
  });

  describe('Decode and validate token', () => {

    it('should decode jwt token', done => {
      var reqId = 'a-req-id';
      var encodedToken = jwt.encode({foo: 'bar'});

      bus
        .request('auth-service.decode-token', { reqId: reqId, data: encodedToken })
        .then(resp => {
          expect(resp.data.foo).toBe('bar');
          expect(resp.reqId).toBe(reqId);
          done();
        });

    });

    it('should fail to decode invalid jwt token', done => {
      var reqId = 'a-req-id';
      var encodedToken = 'poop';

      bus
        .request('auth-service.decode-token', { reqId: reqId, data: encodedToken })
        .then(done.fail)
        .catch(err => {
          expect(err.status).toBe(403);
          expect(err.reqId).toBe(reqId);           
          done();
        });

    });

  });

  describe('Refresh tokens', () => {

    beforeAll(done => {

      var refreshTokens = [
        {
          _id: uuid.v4(),
          userId: 'userId',
          token: 'validToken',
          expired: false,
          expires: new Date(new Date().getTime() + 1000*60)
        },
        {
          _id: uuid.v4(),          
          userId: 'userId',
          token: 'expiredByDateToken',
          expired: false,
          expires: new Date(new Date().getTime() - 1000) // <-- expired by date
        },
        {
          _id: uuid.v4(),          
          userId: 'userId',
          token: 'expiredToken',
          expired: true,  // <-- explicitly expired
          expires: new Date(new Date().getTime() + 1000*60)
        }
      ];

      Promise.all(refreshTokens.map(o => refreshTokenColl.insert(o))).then(done);  
    });

    it('should get new access token from refresh token', done => {
      var reqId = 'a-req-id';
      var encodedToken = jwt.encode({foo: 'bar'});

      bus.subscribe('user-service.get', req => {
        return {
          status: 200,
          data: {
            'id': 'userId',
            'firstName': 'firstName',
            'lastName': 'lastName',
            'mail': 'mail'
          }
        };
      });

      bus
        .request('http.post.auth.refresh', { 
          reqId: reqId, 
          data: { 
            refreshToken: 'validToken' 
          }
        })
        .then(resp => {          
          var decodedAccessToken = jwt.decode(resp.data);
          expect(decodedAccessToken.id).toBe('userId');          
          done();
        })
        .catch(done.fail);
    });

    it('should not get new access token from expired refresh token (expired by setting `expired=true`)', done => {
      bus
        .request('http.post.auth.refresh', { 
          data: { 
            refreshToken: 'expiredToken' 
          }
        })
        .then(done.fail)
        .catch(resp => {        
          expect(resp.status).toBe(420);          
          expect(resp.error.code).toBe(errors.code.refreshTokenExpired);          
          done();          
        });
    });

    it('should not get new access token from expired refresh token (expired by date)', done => {            
      bus
        .request('http.post.auth.refresh', { 
          data: { 
            refreshToken: 'expiredByDateToken' 
          }
        })
        .then(done.fail)
        .catch(resp => {
          expect(resp.status).toBe(420);          
          expect(resp.error.code).toBe(errors.code.refreshTokenExpired);          
          done();
        });
    });

  });

});