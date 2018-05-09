const bus = require("fruster-bus");
const cookie = require("cookie");
const log = require("fruster-log");
const JWT = require("../lib/utils/JWT");
const authService = require("../auth-service");
const conf = require("../conf");
const uuid = require("uuid");
const errors = require("../lib/errors");
const constants = require("../lib/constants");
const testUtils = require("fruster-test-utils");
const UserServiceClient = require("../lib/clients/UserServiceClient");


describe("Token login service", () => {
	let refreshTokenColl;

	testUtils.startBeforeEach({
		mongoUrl: "mongodb://localhost:27017/tokin-login-test",
		service: authService,
		bus: bus,
		mockNats: true,
		afterStart: (connection) => {
			refreshTokenColl = connection.db.collection(constants.collection.REFRESH_TOKENS);
			return Promise.resolve();
		}
	});

	it("should login and return access and refreshtoken in body", async done => {
		try {
			const now = Date.now();
			const reqId = "a-req-id";

			testUtils.mockService({
				subject: UserServiceClient.endpoints.GET_USER,
				data: [{
					id: "id",
					firstName: "firstName",
					lastName: "lastName",
					email: "email"
				}]
			});

			testUtils.mockService({
				subject: UserServiceClient.endpoints.VALIDATE_PASSWORD,
				data: { id: "id" }
			});

			const resp = await bus.request({
				subject: constants.endpoints.http.LOGIN_WITH_TOKEN,
				skipOptionsRequest: true,
				message: {
					reqId: reqId,
					data: {
						username: "joelsoderstrom",
						password: "ZlatansPonyTail"
					}
				}
			});

			expect(resp.status).toBe(200);
			expect(resp.reqId).toBe(reqId);
			expect(resp.data.accessToken).toBeDefined();
			expect(resp.data.refreshToken).toBeDefined();
			expect(resp.data.profile.id).toBe("id");
			expect(resp.data.profile.firstName).toBe("firstName");

			const decodedJWT = JWT.decode(resp.data.accessToken);

			expect(decodedJWT.id).toBe("id");
			expect(decodedJWT.firstName).toBe("firstName");
			expect(decodedJWT.lastName).toBe("lastName");
			expect(decodedJWT.email).toBe("email");
			expect(decodedJWT.exp).toBeDefined("exp");

			const token = await refreshTokenColl.findOne({
				token: resp.data.refreshToken
			});
			expect(token).toBeTruthy("should gotten refreshToken " + resp.data.refreshToken)
			expect(token.userId).toBe("id");
			expect(token.expires.getTime()).not.toBeLessThan(now);
			expect(token.expired).toBe(false);

			done();
		} catch (err) {
			log.error(err);
			done.fail(err);
		}
	});

	it("should return 401 if invalid username or password", async done => {
		try {
			const reqId = "a-req-id";

			bus.subscribe({
				subject: UserServiceClient.endpoints.VALIDATE_PASSWORD,
				handle: req => {
					return {
						status: 401,
						reqId: req.reqId
					};
				}
			});

			try {
				await bus.request(constants.endpoints.http.LOGIN_WITH_TOKEN, {
					reqId: reqId,
					data: { username: "joelsoderstrom", password: "ZlatansPonyTail" }
				});

				done.fail();
			} catch (err) {
				expect(err.status).toBe(401);
				expect(err.reqId).toBe(reqId);

				done();
			}
		} catch (err) {
			log.error(err);
			done.fail(err);
		}
	});

	it("should return 400 if username was not provided", async done => {
		try {
			const reqId = "a-req-id";

			bus.subscribe(UserServiceClient.endpoints.VALIDATE_PASSWORD, req => {
				return {
					status: 401,
					reqId: req.reqId
				};
			});

			try {
				await bus.request({
					subject: constants.endpoints.http.LOGIN_WITH_TOKEN,
					skipOptionsRequest: true,
					message: {
						reqId: reqId,
						data: { password: "ZlatansPonyTail" }
					}
				});
			} catch (err) {
				expect(err.status).toBe(400);
				expect(err.reqId).toBe(reqId);

				done();
			}
		} catch (err) {
			log.error(err);
			done.fail(err);
		}
	});

});