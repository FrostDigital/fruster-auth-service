const bus = require("fruster-bus"),
  cookie = require("cookie"),
  log = require("fruster-log"),
  jwt = require("../jwt"),
  authService = require("../auth-service"),
  conf = require("../conf"),
  uuid = require("uuid"),
  errors = require("../errors"),
  mongo = require("mongodb-bluebird"),
  testUtils = require("fruster-test-utils");


describe("Auth service", () => {
  let refreshTokenColl;

  testUtils.startBeforeEach({
    mongoUrl: "mongodb://localhost:27017/auth-service-test",
    service: authService,
    bus: bus,
    afterStart: (connection) => {
      refreshTokenColl = connection.db.collection(conf.refreshTokenCollection);
      return Promise.resolve();
    }
  });

  describe("Web login", () => {

    it("should login and return JWT as cookie", done => {
      var reqId = "a-req-id";
      var username = "joelsoderstrom";
      var password = "ZlatansPonyTail";

      bus.subscribe("user-service.validate-password", req => {
        expect(req.data.username).toBe(username);
        expect(req.data.password).toBe(password);

        return {
          status: 200,
          data: {
            "id": "id",
            "firstName": "firstName",
            "lastName": "lastName",
            "email": "email"
          }
        };
      });

      bus.request("http.post.auth.web", {
          reqId: reqId,
          data: {
            username: username,
            password: password
          }
        })
        .then(resp => {
          expect(resp.status).toBe(200);
          expect(resp.reqId).toBe(reqId);
          expect(resp.headers["Set-Cookie"]).toBeDefined();
          expect(resp.headers["Set-Cookie"]).not.toMatch("domain");
          expect(resp.headers["Set-Cookie"]).toMatch("HttpOnly;");

          var jwtCookie = cookie.parse(resp.headers["Set-Cookie"]).jwt;
          var decodedJWT = jwt.decode(jwtCookie);

          expect(decodedJWT.id).toBe("id");
          expect(decodedJWT.firstName).toBe("firstName");
          expect(decodedJWT.lastName).toBe("lastName");
          expect(decodedJWT.email).toBe("email");
          expect(decodedJWT.exp).toBeDefined();

          done();
        })
        .catch(done.fail);
    });

    it("should login and return a non HttpOnly JWT as cookie", done => {
      conf.jwtCookieHttpOnly = false;

      var reqId = "a-req-id";
      var username = "joelsoderstrom";
      var password = "ZlatansPonyTail";

      bus.subscribe("user-service.validate-password", req => {        
        return {
          status: 200,
          data: {
            "id": "id",
            "firstName": "firstName",
            "lastName": "lastName",
            "email": "email"
          }
        };
      });

      bus.request("http.post.auth.web", {
          reqId: reqId,
          data: {
            username: username,
            password: password
          }
        })
        .then(resp => {
          expect(resp.headers["Set-Cookie"]).not.toMatch("HttpOnly;");          
          conf.jwtCookieHttpOnly = true;
          done();
        })
        .catch(done.fail);
    });

    it("should return 401 if invalid username or password", done => {
      var reqId = "a-req-id";

      bus.subscribe("user-service.validate-password", req => {
        return {
          status: 401
        };
      });

      bus.request("http.post.auth.web", {
          reqId: reqId,
          data: {
            username: "joelsoderstrom",
            password: "ZlatansPonyTail"
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

    it("should generate web JWT token for user", done => {
      bus.subscribe(conf.userServiceGetUserSubject, () => {
        return {
          "status": 200,
          "data": [{
            "roles": [
              "admin"
            ],
            "firstName": "firstName",
            "middleName": "middleName",
            "lastName": "lastName",
            "email": "email",
            "id": "id",
          }],
          "error": {},
          "reqId": "reqId"
        };
      });

      bus.request("auth-service.generate-jwt-token-for-user.web", {
          reqId: "reqId",
          data: {
            firstName: "viktor"
          }
        })
        .then(resp => {
          expect(resp.status).toBe(200);
          expect(resp.reqId).toBe("reqId");
          expect(resp.headers["Set-Cookie"]).toBeDefined();

          var jwtCookie = cookie.parse(resp.headers["Set-Cookie"]).jwt;
          var decodedJWT = jwt.decode(jwtCookie);

          expect(decodedJWT.id).toBe("id");
          expect(decodedJWT.firstName).toBe("firstName");
          expect(decodedJWT.lastName).toBe("lastName");
          expect(decodedJWT.email).toBe("email");
          expect(decodedJWT.exp).toBeDefined();

          done();
        });
    });

    it("should fail to generate web JWT token if user not found", done => {
      bus.subscribe(conf.userServiceGetUserSubject, () => {
        return {
          "status": 200,
          "data": [],
          "error": {},
          "reqId": "reqId"
        };
      });

      bus.request("auth-service.generate-jwt-token-for-user.web", {
          reqId: "reqId",
          data: {
            firstName: "does not exist"
          }
        })
        .catch(resp => {
          expect(resp.status).toBe(404);          
          expect(resp.error.code).toBe(errors.code.userNotFound);      
          done();
        });
    });

    it("should fail to generate web JWT token if multiple users found", done => {
      bus.subscribe(conf.userServiceGetUserSubject, () => {
        return {
          "status": 200,
          "data": [{ firstName: "fakeUser1" }, { firstName: "fakeUser2" }],
          "error": {},
          "reqId": "reqId"
        };
      });

      bus.request("auth-service.generate-jwt-token-for-user.web", {
          reqId: "reqId",
          data: {
            firstName: "does not exist"
          }
        })
        .catch(resp => {
          expect(resp.status).toBe(500);          
          expect(resp.error.code).toBe(errors.code.unexpectedError);      
          done();
        });
    });

  });


  describe("App login", () => {

    it("should login and return access and refreshtoken in body", done => {
      const now = Date.now();
      var reqId = "a-req-id";

      bus.subscribe("user-service.validate-password", req => {
        return {
          status: 200,
          reqId: req.reqId,
          data: {
            "id": "id",
            "firstName": "firstName",
            "lastName": "lastName",
            "email": "email"
          }
        };
      });

      bus.request("http.post.auth.app", {
          reqId: reqId,
          data: {
            username: "joelsoderstrom",
            password: "ZlatansPonyTail"
          }
        })
        .then(function (resp) {
          expect(resp.status).toBe(200);
          expect(resp.reqId).toBe(reqId);
          expect(resp.data.accessToken).toBeDefined();
          expect(resp.data.refreshToken).toBeDefined();
          expect(resp.data.profile.id).toBe("id");
          expect(resp.data.profile.firstName).toBe("firstName");

          var decodedJWT = jwt.decode(resp.data.accessToken);

          expect(decodedJWT.id).toBe("id");
          expect(decodedJWT.firstName).toBe("firstName");
          expect(decodedJWT.lastName).toBe("lastName");
          expect(decodedJWT.email).toBe("email");

          return refreshTokenColl.findOne({
            token: resp.data.refreshToken
          }).then(function (token) {
            expect(token.userId).toBe("id");
            expect(token.expires.getTime()).not.toBeLessThan(now);
            expect(token.expired).toBe(false);

            done();
          });
        })
        .catch(done.fail);
    });

    it("should return 401 if invalid username or password", done => {
      var reqId = "a-req-id";

      bus.subscribe("user-service.validate-password", req => {
        return {
          status: 401,
          reqId: req.reqId
        };
      });

      bus.request("http.post.auth.app", {
          reqId: reqId,
          data: {
            username: "joelsoderstrom",
            password: "ZlatansPonyTail"
          }
        })
        .then(done.fail)
        .catch(function (error) {
          expect(error.status).toBe(401);
          expect(error.reqId).toBe(reqId);
          done();
        });
    });

    it("should generate app JWT token for user", done => {
      bus.subscribe(conf.userServiceGetUserSubject, () => {
        return {
          "status": 200,
          "data": [{
            "roles": [
              "admin"
            ],
            "firstName": "firstName",
            "middleName": "middleName",
            "lastName": "lastName",
            "email": "email",
            "id": "id",
          }],
          "error": {},
          "reqId": "reqId"
        };
      });


      bus.request("auth-service.generate-jwt-token-for-user.app", {
          reqId: "hello",
          data: {
            firstName: "viktor"
          }
        })
        .then(resp => {
          expect(resp.status).toBe(200);
          expect(resp.reqId).toBe("reqId");
          expect(resp.data.accessToken).toBeDefined();
          expect(resp.data.refreshToken).toBeDefined();
          expect(resp.data.profile.id).toBe("id");
          expect(resp.data.profile.firstName).toBe("firstName");

          var decodedJWT = jwt.decode(resp.data.accessToken);

          expect(decodedJWT.id).toBe("id");
          expect(decodedJWT.firstName).toBe("firstName");
          expect(decodedJWT.lastName).toBe("lastName");
          expect(decodedJWT.email).toBe("email");

          return refreshTokenColl.findOne({
            token: resp.data.refreshToken
          }).then(function (token) {
            expect(token.userId).toBe("id");
            expect(token.expires).toBeDefined();
            expect(token.expired).toBe(false);

            done();
          });
        });
    });

  });

  describe("Decode and validate token", () => {

    it("should decode jwt token", done => {
      var reqId = "a-req-id";
      var encodedToken = jwt.encode({
        foo: "bar"
      });

      bus.request("auth-service.decode-token", {
          reqId: reqId,
          data: encodedToken
        })
        .then(resp => {
          expect(resp.data.foo).toBe("bar");
          expect(resp.reqId).toBe(reqId);
          done();
        });

    });

    it("should fail to decode invalid jwt token", done => {
      var reqId = "a-req-id";
      var encodedToken = "poop";

      bus.request("auth-service.decode-token", {
          reqId: reqId,
          data: encodedToken
        })
        .then(done.fail)
        .catch(err => {
          expect(err.status).toBe(403);
          expect(err.reqId).toBe(reqId);
          expect(err.error.detail).toBeDefined();
          
          done();
        });

    });


    it("should respond with appropriate message if jwt token has expired", done => {
      var reqId = "a-req-id";
      var encodedToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE0Nzk4NDA5ODcuMDksImlkIjoiYzFlMDk2NDEtMWJiMi00Y2E0LTg2ZGEtNzk4M2E3MmRkMmZmIiwiZmlyc3ROYW1lIjoiTSIsImxhc3ROYW1lIjoiTSIsImVtYWlsIjoibWVAbWUubWUiLCJzY29wZXMiOlsicHJvZmlsZS5nZXQiXSwicm9sZXMiOlsidXNlciJdfQ.8UBPwulAXKCkM7NAOCUL2KPz5ajkFeFIsYJU9yiQ08c";

      bus.request("auth-service.decode-token", {
          reqId: reqId,
          data: encodedToken
        })
        .then(done.fail)
        .catch(err => {          
          expect(err.status).toBe(403);
          expect(err.reqId).toBe(reqId);
          expect(err.error.detail).toBe("Token expired");

          done();
        });

    });



  });


  describe("Refresh tokens", () => {

    beforeEach(done => {

      var refreshTokens = [{
        _id: uuid.v4(),
        userId: "userId",
        token: "validToken",
        expired: false,
        expires: new Date(Date.now() + 1000 * 60)
      }, {
        _id: uuid.v4(),
        userId: "userId",
        token: "expiredByDateToken",
        expired: false,
        expires: new Date(Date.now() - 1000) // <-- expired by date
      }, {
        _id: uuid.v4(),
        userId: "userId",
        token: "expiredToken",
        expired: true, // <-- explicitly expired
        expires: new Date(Date.now() + 1000 * 60)
      }];

      Promise.all(refreshTokens.map(o => refreshTokenColl.insert(o))).then(done);
    });

    it("should get new access token from refresh token", done => {

      var reqId = "a-req-id";
      var encodedToken = jwt.encode({
        foo: "bar"
      });

      bus.subscribe("user-service.get", req => {
        return {
          status: 200,
          data: [{
            "id": "userId",
            "firstName": "firstName",
            "lastName": "lastName",
            "mail": "mail"
          }]
        };
      });

      bus.request("http.post.auth.refresh", {
          reqId: reqId,
          data: {
            refreshToken: "validToken"
          }
        })
        .then(resp => {
          var decodedAccessToken = jwt.decode(resp.data);
          expect(decodedAccessToken.id).toBe("userId");
          done();
        })
        .catch(err => {
          console.log(err);
          done.fail();
        });
    });

    it("should not get new access token from expired refresh token (expired by setting `expired=true`)", done => {
      bus.request("http.post.auth.refresh", {
          data: {
            refreshToken: "expiredToken"
          }
        })
        .then(done.fail)
        .catch(resp => {
          expect(resp.status).toBe(420);
          expect(resp.error.code).toBe(errors.code.refreshTokenExpired);
          done();
        });
    });

    it("should not get new access token from expired refresh token (expired by date)", done => {
      bus.request("http.post.auth.refresh", {
          data: {
            refreshToken: "expiredByDateToken"
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