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

describe("Refresh", () => {

	/** @type {Db} */
	let db;

	let refreshTokenColl;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions(async (connection) => {
				db = connection.db;
				refreshTokenColl = db.collection(constants.collection.REFRESH_TOKENS);
				await createMockRefreshTokens();
			}));

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

	it("should get new access token from refresh token", async () => {
		const reqId = "a-req-id";

		mocks.getUsers([{
			id: "userId",
			firstName: "firstName",
			lastName: "lastName",
			mail: "mail"
		}]);

		const { data } = await bus.request({
			subject: constants.endpoints.http.REFRESH_AUTH,
			skipOptionsRequest: true,
			message: {
				reqId: reqId,
				data: { refreshToken: "validToken" }
			}
		});

		const decodedAccessToken = jwt.decode(data.accessToken, conf.secret);
		expect(decodedAccessToken.id).toBe("userId");
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
