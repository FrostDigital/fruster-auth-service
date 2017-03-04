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

describe("Generate JWT token", () => {
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

	it("should generate JWT token for token/app auth", done => {
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


		bus.request("auth-service.generate-jwt-token-for-user.token", {
				reqId: "reqId",
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
				}).then(function(token) {
					expect(token.userId).toBe("id");
					expect(token.expires).toBeDefined();
					expect(token.expired).toBe(false);

					done();
				});
			});
	});

	it("should generate JWT token for cookie/web auth", done => {
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

		bus.request("auth-service.generate-jwt-token-for-user.cookie", {
				reqId: "reqId",
				data: {
					firstName: "viktor"
				}
			})
			.then(resp => {
				expect(resp.status).toBe(200);
				expect(resp.reqId).toBe("reqId");
				expect(resp.headers["Set-Cookie"]).toBeDefined();

				let jwtCookie = cookie.parse(resp.headers["Set-Cookie"]).jwt;
				let decodedJWT = jwt.decode(jwtCookie);

				expect(decodedJWT.id).toBe("id");
				expect(decodedJWT.firstName).toBe("firstName");
				expect(decodedJWT.lastName).toBe("lastName");
				expect(decodedJWT.email).toBe("email");
				expect(decodedJWT.exp).toBeDefined();
				
				done();
			});
	});

});