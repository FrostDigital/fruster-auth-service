const bus = require("fruster-bus"),
	cookie = require("cookie"),
	log = require("fruster-log"),
	jwt = require("../lib/utils/jwt"),
	authService = require("../auth-service"),
	conf = require("../conf"),
	uuid = require("uuid"),
	errors = require("../lib/errors"),
	constants = require("../lib/constants"),
	testUtils = require("fruster-test-utils");


describe("Refresh", () => {
	let refreshTokenColl;

	testUtils.startBeforeEach({
		mongoUrl: "mongodb://localhost:27017/refresh-test",
		service: authService,
		bus: bus,
		mockNats: true,
		afterStart: async (connection) => {
			refreshTokenColl = connection.db.collection(constants.collection.refreshTokens);
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
			const encodedToken = jwt.encode({ foo: "bar" });

			testUtils.mockService({
				subject: conf.userServiceGetUserSubject,
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

			const decodedAccessToken = jwt.decode(resp.data.accessToken);
			expect(decodedAccessToken.id).toBe("userId");

			done();
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