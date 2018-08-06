const bus = require("fruster-bus");
const log = require("fruster-log");
const authService = require("../auth-service");
const constants = require("../lib/constants");
const testUtils = require("fruster-test-utils");
const UserServiceClient = require("../lib/clients/UserServiceClient");
const SessionRepo = require("../lib/repos/SessionRepo");
const JWTManager = require("../lib/managers/JWTManager");
const Db = require("mongodb").Db;


describe("Token login service", () => {

	let refreshTokenColl;
	/** @type {Db} */
	let db;
	/** @type {SessionRepo} */
	let sessionRepo;
	/** @type {JWTManager} */
	let jwtManager;

	testUtils.startBeforeEach({
		mongoUrl: "mongodb://localhost:27017/tokin-login-test",
		service: authService,
		bus: bus,
		mockNats: true,
		afterStart: (connection) => {
			db = connection.db;
			refreshTokenColl = db.collection(constants.collection.REFRESH_TOKENS);

			sessionRepo = new SessionRepo(db);
			jwtManager = new JWTManager(sessionRepo);

			return Promise.resolve();
		}
	});

	it("should login and return access and refreshtoken in body", async done => {
		try {
			const now = Date.now();
			const reqId = "a-req-id";

			testUtils.mockService({
				subject: UserServiceClient.endpoints.GET_USER,
				data: {
					users: [{
						id: "id",
						firstName: "firstName",
						lastName: "lastName",
						email: "email"
					}],
					totalCount: 1
				}
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

			const decodedJWT = await jwtManager.decode(resp.data.accessToken);

			expect(decodedJWT.id).toBe("id");
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