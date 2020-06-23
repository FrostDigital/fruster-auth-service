const jwt = require("jwt-simple");
const uuid = require("uuid");
const bus = require("fruster-bus").testBus;
const Db = require("mongodb").Db;
const frusterTestUtils = require("fruster-test-utils");
const conf = require("../conf");
const errors = require("../lib/deprecatedErrors");
const constants = require("../lib/constants");
const specConstants = require("./support/spec-constants");
const mocks = require("./support/mocks");
const SessionFixtures = require("./support/session-fixtures");
const JWTManager = require("../lib/managers/JWTManager");
const SessionRepo = require("../lib/repos/SessionRepo");

describe("Refresh", () => {

	/** @type {Db} */
	let db;

	let refreshTokenCollection;
	let sessionCollection;

	/** @type {SessionRepo} */
	let sessionRepo;

	/** @type {JWTManager} */
	let jwtManager;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions(async (connection) => {
				db = connection.db;
				refreshTokenCollection = db.collection(constants.collection.REFRESH_TOKENS);
				sessionCollection = db.collection(constants.collection.SESSIONS);
				sessionRepo = new SessionRepo(db);
				jwtManager = new JWTManager(sessionRepo);
				await createMockRefreshTokens();
			}));

	async function createMockRefreshTokens() {
		await refreshTokenCollection.remove({});

		const refreshTokens = [{
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

		await Promise.all(refreshTokens.map(o => refreshTokenCollection.insert(o)));
	}

	it("should get new access token from refresh token", async () => {

		const encodedToken = await jwtManager.encode({ id: "userId" }, 100000, {});

		const reqId = "a-req-id";

		mocks.getUsers([{
			id: "userId",
			firstName: "firstName",
			lastName: "lastName",
			mail: "mail"
		}]);

		const { data } = await bus.request({
			subject: constants.endpoints.http.REFRESH_AUTH,
			message: {
				reqId: reqId,
				data: { refreshToken: "validToken" },
				headers: {
					version: "13.0.1",
					["user-agent"]: "wellbee%20Test/1184 CFNetwork/1125.2 Darwin/19.4.0",
					authorization: `Bearer ${encodedToken}`
				}
			}
		});

		const decodedAccessToken = jwt.decode(data.accessToken, conf.secret);
		expect(decodedAccessToken.id).toBe("userId");

		const sessions = await sessionCollection.find({ userId: "userId" }).toArray();

		expect(sessions.length).toBe(1);

		expect(sessions[0]).toBeDefined("should have created a new session");
		expect(sessions[0].sessionDetails).toBeDefined("session should have sessionDetails");
		expect(sessions[0].sessionDetails.created).toBeDefined("session details should have created date");
		expect(sessions[0].sessionDetails.lastActivity).toBeDefined("session details should have lastActivity date");
		expect(sessions[0].sessionDetails.userAgent).toBeDefined("session details should have user agent");
		expect(sessions[0].sessionDetails.version).toBeDefined("session details should have version");
		expect(sessions[0].id).not.toBe(SessionFixtures.sessions[0].id, "new session should not have the same id as the old one");
	});

	it("should return 404 if user does not exist", async done => {
		const reqId = "a-req-id";

		mocks.getUsers([]);

		try {
			await bus.request({
				subject: constants.endpoints.http.REFRESH_AUTH,
				skipOptionsRequest: true,
				message: {
					reqId: reqId,
					data: { refreshToken: "validToken" }
				}
			});

			done.fail();
		} catch (err) {
			expect(err.status).toBe(404, "err.status");
			expect(err.error.code).toBe(errors.userNotFound().error.code, "err.error.code");

			done();
		}
	});

	it("should not get new access token from expired refresh token (expired by setting `expired=true`)", async done => {
		try {
			await bus.request({
				subject: constants.endpoints.http.REFRESH_AUTH,
				skipOptionsRequest: true,
				message: {
					reqId: uuid.v4(),
					data: { refreshToken: "expiredToken" }
				}
			});

			done.fail();
		} catch (err) {
			expect(err.status).toBe(420);
			expect(err.error.code).toBe(errors.code.refreshTokenExpired);

			done();
		}
	});

	it("should not get new access token from expired refresh token (expired by date)", async done => {
		try {
			await bus.request({
				subject: constants.endpoints.http.REFRESH_AUTH,
				skipOptionsRequest: true,
				message: {
					reqId: uuid.v4(),
					data: { refreshToken: "expiredByDateToken" }
				}
			});

			done.fail();
		} catch (err) {
			expect(err.status).toBe(420);
			expect(err.error.code).toBe(errors.code.refreshTokenExpired);

			done();
		}
	});

});
