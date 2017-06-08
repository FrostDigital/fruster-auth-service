const bus = require("fruster-bus");
const cookie = require("cookie");
const log = require("fruster-log");
const jwt = require("../lib/utils/jwt");
const authService = require("../auth-service");
const conf = require("../conf");
const uuid = require("uuid");
const errors = require("../errors");
const constants = require("../constants");
const testUtils = require("fruster-test-utils");
const RefreshTokenRepo = require("../lib/repos/RefreshTokenRepo");

describe("Generate JWT token", () => {
	let refreshTokenColl, refreshTokenRepo;

	testUtils.startBeforeEach({
		mongoUrl: "mongodb://localhost:27017/generate-jwt-token-test",
		service: authService,
		bus: bus,
		afterStart: (connection) => {
			refreshTokenColl = connection.db.collection(constants.collection.refreshTokens);
			refreshTokenRepo = new RefreshTokenRepo(connection.db);
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

				let decodedJWT = jwt.decode(resp.data.accessToken);

				expect(decodedJWT.id).toBe("id");
				expect(decodedJWT.firstName).toBe("firstName");
				expect(decodedJWT.lastName).toBe("lastName");
				expect(decodedJWT.email).toBe("email");

				return refreshTokenRepo.get(resp.data.refreshToken)
				.then((token) => {	
					expect(token).toBeTruthy("should gotten refreshToken " + resp.data.refreshToken);					
					expect(token.userId).toBe("id");
					expect(token.expires).toBeDefined();
					expect(token.expired).toBe(false);

					done();
				});
			})
			.catch(err => {
				console.log(err);
				done.fail();
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