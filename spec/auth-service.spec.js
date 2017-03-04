const bus = require("fruster-bus"),
  cookie = require("cookie"),
  log = require("fruster-log"),
  jwt = require("../lib/utils/jwt"),
  authService = require("../auth-service"),
  conf = require("../conf"),
  uuid = require("uuid"),
  errors = require("../errors"),
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

});