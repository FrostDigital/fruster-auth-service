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
		mongoUrl: "mongodb://localhost:27017/tokin-login-test",
		service: authService,
		bus: bus,
		afterStart: (connection) => {
			refreshTokenColl = connection.db.collection(constants.collection.refreshTokens);
			return Promise.resolve();
		}
	});

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
			.then((resp) => {
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
				}).then((token) => {
					expect(token).toBeTruthy("should gotten refreshToken " + resp.data.refreshToken)
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

		bus.request("http.post.auth.token", {
				reqId: reqId,
				data: {
					username: "joelsoderstrom",
					password: "ZlatansPonyTail"
				}
			})
			.then(done.fail)
			.catch((error) => {
				expect(error.status).toBe(401);
				expect(error.reqId).toBe(reqId);
				done();
			});
	});

	it("should return 400 if username was not provided", done => {
		var reqId = "a-req-id";

		bus.subscribe("user-service.validate-password", req => {
			return {
				status: 401,
				reqId: req.reqId
			};
		});

		bus.request("http.post.auth.token", {
				reqId: reqId,
				data: {					
					password: "ZlatansPonyTail"
				}
			})
			.then(done.fail)
			.catch((error) => {
				expect(error.status).toBe(400);
				expect(error.reqId).toBe(reqId);
				done();
			});
	});

});