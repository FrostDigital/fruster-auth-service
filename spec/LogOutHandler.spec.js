const Db = require("mongodb").Db;
const bus = require("fruster-bus").testBus;
const frusterTestUtils = require("fruster-test-utils");
const constants = require("../lib/constants");
const specConstants = require("./support/spec-constants");
const mocks = require("./support/mocks");


describe("LogOutHandler", () => {

	/** @type {Db} */
	let db;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions(async (connection) => { db = connection.db; }));

	it("should remove cookie after logout", async () => {
		const reqId = "a-req-id";
		const credentials = { username: "joelsoderstrom", password: "ZlatansPonyTail" };

		mocks.getUsers([{
			id: "id",
			firstName: "firstName",
			lastName: "lastName",
			email: "email"
		}]);

		mocks.validatePassword();

		const { headers: { ["Set-Cookie"]: cookie } } = await bus.request({
			subject: constants.endpoints.http.LOGIN_WITH_COOKIE,
			skipOptionsRequest: true,
			message: { reqId, data: credentials }
		});

		const { status, headers: { ["Set-Cookie"]: expiredCookie } } = await bus.request({
			subject: constants.endpoints.http.LOGOUT,
			skipOptionsRequest: true,
			message: { reqId, headers: { cookie }, user: { scopes: ["ola"] } }
		});

		expect(status).toBe(200);

		expect(expiredCookie).toBeDefined();
		expect(expiredCookie).toMatch("delete");
		expect(expiredCookie).toMatch("expires=Thu, 01 Jan 1970 00:00:00 GMT");
	});

	it("should remove session after logout when logging out with cookie", async () => {
		const reqId = "a-req-id";
		const credentials = { username: "joelsoderstrom", password: "ZlatansPonyTail" };
		const user = {
			id: "id",
			firstName: "firstName",
			lastName: "lastName",
			email: "email",
			scopes: ["ola"]
		};

		mocks.getUsers([user]);
		mocks.validatePassword();

		const { headers: { ["Set-Cookie"]: cookie } } = await bus.request({
			subject: constants.endpoints.http.LOGIN_WITH_COOKIE,
			skipOptionsRequest: true,
			message: { reqId, data: credentials }
		});

		let session = await db.collection(constants.collection.SESSIONS).findOne({ userId: user.id });

		expect(session).toBeDefined("session from database before logout");

		await bus.request({
			subject: constants.endpoints.http.LOGOUT,
			skipOptionsRequest: true,
			message: { headers: { cookie }, reqId, user }
		});

		session = await db.collection(constants.collection.SESSIONS).findOne({ userId: user.id });

		expect(session).toBeNull("session from database after logout");
	});

	it("should remove session after logout when logging out with token", async () => {
		const reqId = "a-req-id";
		const credentials = {
			username: "joelsoderstrom",
			password: "ZlatansPonyTail"
		}
		const user = {
			id: "id",
			firstName: "firstName",
			lastName: "lastName",
			email: "email",
			scopes: ["ola"]
		};

		mocks.getUsers([user]);
		mocks.validatePassword();

		const loginResponse = await bus.request({
			subject: constants.endpoints.http.LOGIN_WITH_TOKEN,
			skipOptionsRequest: true,
			message: { reqId, data: credentials }
		});

		let session = await db.collection(constants.collection.SESSIONS).findOne({ userId: user.id });

		expect(session).toBeDefined("session from database before logout");

		await bus.request({
			subject: constants.endpoints.http.LOGOUT,
			skipOptionsRequest: true,
			message: { headers: { authorization: `Bearer ${loginResponse.data.accessToken}` }, reqId, user }
		});

		session = await db.collection(constants.collection.SESSIONS).findOne({ userId: user.id });

		expect(session).toBeNull("session from database after logout");
	});

	it("should remove session after logout when logging out with Authorization token", async () => {
		const reqId = "a-req-id";
		const credentials = {
			username: "joelsoderstrom",
			password: "ZlatansPonyTail"
		}
		const user = {
			id: "id",
			firstName: "firstName",
			lastName: "lastName",
			email: "email",
			scopes: ["ola"]
		};

		mocks.getUsers([user]);
		mocks.validatePassword();

		const loginResponse = await bus.request({
			subject: constants.endpoints.http.LOGIN_WITH_TOKEN,
			skipOptionsRequest: true,
			message: { reqId, data: credentials }
		});

		let session = await db.collection(constants.collection.SESSIONS).findOne({ userId: user.id });

		expect(session).toBeDefined("session from database before logout");

		await bus.request({
			subject: constants.endpoints.http.LOGOUT,
			skipOptionsRequest: true,
			message: { headers: { Authorization: `Bearer ${loginResponse.data.accessToken}` }, reqId, user }
		});

		session = await db.collection(constants.collection.SESSIONS).findOne({ userId: user.id });

		expect(session).toBeNull("session from database after logout");
	});

	it("should remove all sessions after logout when logging out with logoutAll query", async () => {
		const reqId = "a-req-id";
		const credentials = {
			username: "joelsoderstrom",
			password: "ZlatansPonyTail"
		}
		const user = {
			id: "id",
			firstName: "firstName",
			lastName: "lastName",
			email: "email",
			scopes: ["ola"]
		};

		mocks.getUsers([user]);
		mocks.validatePassword();

		for (let i = 0; i < 5; i++) {
			await bus.request({
				subject: constants.endpoints.http.LOGIN_WITH_COOKIE,
				skipOptionsRequest: true,
				message: { reqId, data: credentials }
			});
			await bus.request({
				subject: constants.endpoints.http.LOGIN_WITH_TOKEN,
				skipOptionsRequest: true,
				message: { reqId, data: credentials }
			});
		}

		let sessions = await db.collection(constants.collection.SESSIONS).find({ userId: user.id }).toArray();

		expect(sessions.length).toBe(10, "sessions from database before logout");

		await bus.request({
			subject: constants.endpoints.http.LOGOUT,
			skipOptionsRequest: true,
			message: { reqId, user, query: { logoutAll: "true" } }
		});

		sessions = await db.collection(constants.collection.SESSIONS).find({ userId: user.id }).toArray();

		expect(sessions.length).toBe(0, "sessions from database after logout");
	});

});
