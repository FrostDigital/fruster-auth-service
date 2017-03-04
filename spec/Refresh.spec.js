const bus = require("fruster-bus"),
  cookie = require("cookie"),
  log = require("fruster-log"),
  jwt = require("../lib/utils/jwt"),
  authService = require("../auth-service"),
  conf = require("../conf"),
  uuid = require("uuid"),
  errors = require("../errors"),
  constants = require("../constants"),
  testUtils = require("fruster-test-utils");


describe("Token login service", () => {
  let refreshTokenColl;

  testUtils.startBeforeEach({
    mongoUrl: "mongodb://localhost:27017/auth-service-test",
    service: authService,
    bus: bus,
    afterStart: (connection) => {
      refreshTokenColl = connection.db.collection(constants.collection.refreshTokens);
      return Promise.resolve();
    }
  });

  beforeEach(done => {

    var refreshTokens = [{
      id: uuid.v4(),
      userId: "userId",
      token: "validToken",
      expired: false,
      expires: new Date(Date.now() + 1000 * 60)
    }, {
      id: uuid.v4(),
      userId: "userId",
      token: "expiredByDateToken",
      expired: false,
      expires: new Date(Date.now() - 1000) // <-- expired by date
    }, {
      id: uuid.v4(),
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

    testUtils.mockService({
      subject: conf.userServiceGetUserSubject,
      data: [{
        "id": "userId",
        "firstName": "firstName",
        "lastName": "lastName",
        "mail": "mail"
      }],
      expectRequestData: {
        id: "userId"
      }
    });

    bus.request("http.post.auth.refresh", {
        reqId: reqId,
        data: {
          refreshToken: "validToken"
        }
      })
      .then(resp => {
        var decodedAccessToken = jwt.decode(resp.data.accessToken);
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