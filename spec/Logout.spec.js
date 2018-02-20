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

describe("Logout", () => {

	testUtils.startBeforeEach({
		mongoUrl: "mongodb://localhost:27017/logout-service-test",
		service: authService,
		bus: bus,
		mockNats: true
	});

	it("should remove cookie after logout", async done => {
		try {
			const reqId = "a-req-id";
			const credentials = {
				username: "joelsoderstrom",
				password: "ZlatansPonyTail"
			}

			testUtils.mockService({
				subject: conf.userServiceGetUserSubject,
				data: [{
					id: "id",
					firstName: "firstName",
					lastName: "lastName",
					email: "email"
				}]
			});

			testUtils.mockService({
				subject: constants.consuming.VALIDATE_PASSWORD,
				data: { id: "id" },
				expectData: credentials
			});

			await bus.request({
				subject: constants.endpoints.http.LOGIN_WITH_COOKIE,
				skipOptionsRequest: true,
				message: { reqId, data: credentials }
			});

			const resp = await bus.request({
				subject: constants.endpoints.http.LOGOUT,
				skipOptionsRequest: true,
				message: { reqId: reqId }
			});

			expect(resp.status).toBe(200);
			expect(resp.reqId).toBe(reqId);
			expect(resp.headers["Set-Cookie"]).toBeDefined();
			expect(resp.headers["Set-Cookie"]).toMatch("delete");
			expect(resp.headers["Set-Cookie"]).toMatch("expires=Thu, 01 Jan 1970 00:00:00 GMT");

			done();
		} catch (err) {
			log.error(err);
			done.fail(err);
		}
	});

});