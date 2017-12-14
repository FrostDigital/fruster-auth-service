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

describe("Logout", () => {

	testUtils.startBeforeEach({
		mongoUrl: "mongodb://localhost:27017/auth-service-test",
		service: authService,
		bus: bus,
		mockNats: true
	});

	it("should remove cookie after logout", async done => {
		const reqId = "a-req-id";
		const credentials = {
			username: "joelsoderstrom",
			password: "ZlatansPonyTail"
		}

		testUtils.mockService({
			subject: conf.userServiceGetUserSubject,
			data: [{
				id: "id", firstName: "firstName", lastName: "lastName", email: "email"
			}],
			expectMaxInvocation: 1
		});

		testUtils.mockService({
			subject: "user-service.validate-password",
			data: { id: "id" },
			expectData: credentials
		});

		try {
			await bus.request("http.post.auth.web", { reqId: reqId, data: credentials });
			const resp = await bus.request("http.post.auth.logout", { reqId: reqId });

			expect(resp.status).toBe(200);
			expect(resp.reqId).toBe(reqId);
			expect(resp.headers["Set-Cookie"]).toBeDefined();
			expect(resp.headers["Set-Cookie"]).toMatch("delete");
			expect(resp.headers["Set-Cookie"]).toMatch("expires=Thu, 01 Jan 1970 00:00:00 GMT");

			done();
		} catch (err) {
			log.error(err);
			done.fail();
		}
	});

});