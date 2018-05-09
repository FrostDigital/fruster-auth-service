const bus = require("fruster-bus");
const cookie = require("cookie");
const log = require("fruster-log");
const jwt = require("../lib/utils/jwt");
const authService = require("../auth-service");
const conf = require("../conf");
const uuid = require("uuid");
const errors = require("../lib/errors");
const constants = require("../lib/constants");
const testUtils = require("fruster-test-utils");
const UserServiceClient = require("../lib/clients/UserServiceClient");


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