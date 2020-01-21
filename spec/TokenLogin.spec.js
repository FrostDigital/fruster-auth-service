const Db = require("mongodb").Db;
const bus = require("fruster-bus").testBus;
const frusterTestUtils = require("fruster-test-utils");
const conf = require("../conf");
const constants = require("../lib/constants");
const UserServiceClient = require("../lib/clients/UserServiceClient");
const SessionRepo = require("../lib/repos/SessionRepo");
const JWTManager = require("../lib/managers/JWTManager");
const specConstants = require("./support/spec-constants");
const mocks = require("./support/mocks");
const SpecUtils = require("./support/SpecUtils");

describe("Token login service", () => {

	let refreshTokenColl;
	/** @type {Db} */
	let db;
	/** @type {SessionRepo} */
	let sessionRepo;
	/** @type {JWTManager} */
	let jwtManager;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions(async (connection) => {
				db = connection.db;
				refreshTokenColl = db.collection(constants.collection.REFRESH_TOKENS);

				sessionRepo = new SessionRepo(db);
				jwtManager = new JWTManager(sessionRepo);
			}));

	afterEach(() => SpecUtils.resetConfig());

	it("should login and return access and refresh token in body", async () => {
		const now = Date.now();
		const reqId = "a-req-id";

		mocks.getUsers([{ id: "id", firstName: "firstName", lastName: "lastName", email: "email" }])
		mocks.validatePassword();

		const { status, reqId: resReqId, data } = await bus.request({
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

		expect(status).toBe(200);
		expect(resReqId).toBe(reqId);
		expect(data.accessToken).toBeDefined();
		expect(data.refreshToken).toBeDefined();
		expect(data.profile.id).toBe("id");
		expect(data.profile.firstName).toBe("firstName");

		const decodedJWT = await jwtManager.decode(data.accessToken);

		expect(decodedJWT.id).toBe("id");
		expect(decodedJWT.exp).toBeDefined("exp");

		const token = await refreshTokenColl.findOne({
			token: data.refreshToken
		});
		expect(token).toBeTruthy("should gotten refreshToken " + data.refreshToken)
		expect(token.userId).toBe("id");
		expect(token.expires.getTime()).not.toBeLessThan(now);
		expect(token.expired).toBe(false);
	});

	it("should return 401 if invalid username or password", async done => {
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
	});

	it("should return 400 if username was not provided", async done => {
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
	});

	it("possible to user data response key", async () => {
		const reqId = "a-req-id";

		conf.userDataResponseKey = "user";

		mocks.getUsers([{ id: "id", firstName: "firstName", lastName: "lastName", email: "email" }])
		mocks.validatePassword();

		const { status, data } = await bus.request({
			subject: constants.endpoints.http.LOGIN_WITH_TOKEN,
			skipOptionsRequest: true,
			message: {
				reqId,
				data: {
					username: "joelsoderstrom",
					password: "ZlatansPonyTail"
				}
			}
		});

		expect(status).toBe(200);
		expect(data[conf.userDataResponseKey]).toBeDefined("config user data response");
	});

});
