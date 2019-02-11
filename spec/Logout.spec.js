const bus = require("fruster-bus");
const log = require("fruster-log");
const authService = require("../auth-service");
const constants = require("../lib/constants");
const testUtils = require("fruster-test-utils");
const UserServiceClient = require("../lib/clients/UserServiceClient");
const Db = require("mongodb").Db;


describe("Logout", () => {

	/** @type {Db} */
	let db;

	testUtils.startBeforeEach({
		mongoUrl: "mongodb://localhost:27017/logout-service-test",
		service: authService,
		bus: bus,
		mockNats: true,
		afterStart: (connection) => {
			db = connection.db;
		}
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
				message: { reqId: reqId, user: { scopes: ["ola"] } }
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

	it("should remove session after logout when logging out with cookie", async done => {
		try {
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

			testUtils.mockService({
				subject: UserServiceClient.endpoints.GET_USER,
				data: {
					users: [user],
					totalCount: 1
				}
			});

			testUtils.mockService({
				subject: UserServiceClient.endpoints.VALIDATE_PASSWORD,
				data: { id: "id" },
				expectData: credentials
			});

			const loginResponse = await bus.request({
				subject: constants.endpoints.http.LOGIN_WITH_COOKIE,
				skipOptionsRequest: true,
				message: { reqId, data: credentials }
			});

			let session = await db.collection(constants.collection.SESSIONS).findOne({ userId: user.id });

			expect(session).toBeDefined("session from database before logout");

			const resp = await bus.request({
				subject: constants.endpoints.http.LOGOUT,
				skipOptionsRequest: true,
				message: { headers: { cookie: loginResponse.headers["Set-Cookie"] }, reqId, user }
			});

			session = await db.collection(constants.collection.SESSIONS).findOne({ userId: user.id });

			expect(session).toBeNull("session from database after logout");

			done();
		} catch (err) {
			log.error(err);
			done.fail(err);
		}
	});

	it("should remove session after logout when logging out with token", async done => {
		try {
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

			testUtils.mockService({
				subject: UserServiceClient.endpoints.GET_USER,
				data: {
					users: [user],
					totalCount: 1
				}
			});

			testUtils.mockService({
				subject: UserServiceClient.endpoints.VALIDATE_PASSWORD,
				data: { id: "id" },
				expectData: credentials
			});

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

			done();
		} catch (err) {
			log.error(err);
			done.fail(err);
		}
	});

	it("should remove session after logout when logging out with Authorization token", async done => {
		try {
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

			testUtils.mockService({
				subject: UserServiceClient.endpoints.GET_USER,
				data: {
					users: [user],
					totalCount: 1
				}
			});

			testUtils.mockService({
				subject: UserServiceClient.endpoints.VALIDATE_PASSWORD,
				data: { id: "id" },
				expectData: credentials
			});

			const loginResponse = await bus.request({
				subject: constants.endpoints.http.LOGIN_WITH_TOKEN,
				skipOptionsRequest: true,
				message: { reqId, data: credentials }
			});

			let session = await db.collection(constants.collection.SESSIONS).findOne({ userId: user.id });

			expect(session).toBeDefined("session from database before logout");

			const resp = await bus.request({
				subject: constants.endpoints.http.LOGOUT,
				skipOptionsRequest: true,
				message: { headers: { Authorization: `Bearer ${loginResponse.data.accessToken}` }, reqId, user }
			});

			session = await db.collection(constants.collection.SESSIONS).findOne({ userId: user.id });

			expect(session).toBeNull("session from database after logout");

			done();
		} catch (err) {
			log.error(err);
			done.fail(err);
		}
	});

	it("should remove all sessions after logout when logging out with logoutAll query", async done => {
		try {
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

			testUtils.mockService({
				subject: UserServiceClient.endpoints.GET_USER,
				data: {
					users: [user],
					totalCount: 1
				}
			});

			testUtils.mockService({
				subject: UserServiceClient.endpoints.VALIDATE_PASSWORD,
				data: { id: "id" },
				expectData: credentials
			});

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
				message: { reqId, user, query: { logoutAll: true } }
			});

			sessions = await db.collection(constants.collection.SESSIONS).find({ userId: user.id }).toArray();

			expect(sessions.length).toBe(0, "sessions from database after logout");

			done();
		} catch (err) {
			log.error(err);
			done.fail(err);
		}
	});

});
