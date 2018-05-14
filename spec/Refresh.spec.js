const bus = require("fruster-bus");
const cookie = require("cookie");
const log = require("fruster-log");
const jwt = require("jwt-simple");
const authService = require("../auth-service");
const conf = require("../conf");
const uuid = require("uuid");
const errors = require("../lib/errors");
const constants = require("../lib/constants");
const testUtils = require("fruster-test-utils");
const UserServiceClient = require("../lib/clients/UserServiceClient");
const Db = require("mongodb").Db;
const SessionRepo = require("../lib/repos/SessionRepo");
const JWTManager = require("../lib/managers/JWTManager");


describe("Refresh", () => {

	/** @type {Db} */
	let db;

	let refreshTokenColl;


	testUtils.startBeforeEach({
		mongoUrl: "mongodb://localhost:27017/refresh-test",
		service: authService,
		bus: bus,
		mockNats: true,
		afterStart: async (connection) => {
			db = connection.db;

			refreshTokenColl = db.collection(constants.collection.REFRESH_TOKENS);
			await createMockRefreshTokens();
		}
	});

	async function createMockRefreshTokens() {
		await refreshTokenColl.remove({});
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

		await Promise.all(refreshTokens.map(o => refreshTokenColl.insert(o)));
	}

	it("should get new access token from refresh token", async done => {
		try {
			const reqId = "a-req-id";
			const encodedToken = jwt.encode({ foo: "bar" }, conf.secret);

			testUtils.mockService({
				subject: UserServiceClient.endpoints.GET_USER,
				data: [{
					id: "userId",
					firstName: "firstName",
					lastName: "lastName",
					mail: "mail"
				}]
			});

			const resp = await bus.request({
				subject: constants.endpoints.http.REFRESH_AUTH,
				skipOptionsRequest: true,
				message: {
					reqId: reqId,
					data: { refreshToken: "validToken" }
				}
			});

			const decodedAccessToken = jwt.decode(resp.data.accessToken, conf.secret);
			expect(decodedAccessToken.id).toBe("userId");

			done();
		} catch (err) {
			log.error(err);
			done.fail(err);
		}
	});

	it("should return 404 if user does not exist", async done => {
		try {
			const reqId = "a-req-id";
			const encodedToken = jwt.encode({ foo: "bar" }, conf.secret);

			testUtils.mockService({
				subject: UserServiceClient.endpoints.GET_USER,
				data: []
			});

			try {
				const resp = await bus.request({
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
		} catch (err) {
			log.error(err);
			done.fail(err);
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