const bus = require("fruster-bus");
const cookie = require("cookie");
const log = require("fruster-log");
const authService = require("../auth-service");
const conf = require("../conf");
const uuid = require("uuid");
const errors = require("../lib/errors");
const constants = require("../lib/constants");
const testUtils = require("fruster-test-utils");
const UserServiceClient = require("../lib/clients/UserServiceClient");
const Db = require("mongodb").Db;
const JWTManager = require("../lib/managers/JWTManager");
const SessionRepo = require("../lib/repos/SessionRepo");
const crypto = require("crypto");


describe("Cookie login", () => {

	/** @type {Db} */
	let db;

	/** @type {SessionRepo} */
	let sessionRepo;

	/** @type {JWTManager} */
	let jwtManager;

	testUtils.startBeforeEach({
		mongoUrl: "mongodb://localhost:27017/cookie-login-test",
		service: authService,
		bus: bus,
		mockNats: true,
		afterStart: connection => {
			db = connection.db;
			sessionRepo = new SessionRepo(db);
			jwtManager = new JWTManager(sessionRepo);
		}
	});

	it("should login and return JWT as cookie", async done => {
		const reqId = "a-req-id";
		const username = "joelsoderstrom";
		const password = "ZlatansPonyTail";

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
			data: [{ id: "id" }],
			expectData: { username, password }
		});

		try {
			const resp = await bus.request({
				subject: constants.endpoints.http.LOGIN_WITH_COOKIE,
				skipOptionsRequest: true,
				message: {
					reqId: reqId,
					data: { username, password }
				}
			});

			expect(resp.status).toBe(200);
			expect(resp.reqId).toBe(reqId);
			expect(resp.headers["Set-Cookie"]).toBeDefined();
			expect(resp.headers["Set-Cookie"]).not.toMatch("domain");
			expect(resp.headers["Set-Cookie"]).toMatch("HttpOnly;");

			const jwtCookie = cookie.parse(resp.headers["Set-Cookie"])[conf.jwtCookieName];
			const decodedJWT = await jwtManager.decode(jwtCookie);

			expect(decodedJWT.id).toBe("id");
			expect(decodedJWT.firstName).toBe("firstName");
			expect(decodedJWT.lastName).toBe("lastName");
			expect(decodedJWT.email).toBe("email");
			expect(decodedJWT.exp).toBeDefined();

			done();
		} catch (err) {
			log.error(err);
			done.fail();
		}
	});

	it("should login and return a non HttpOnly JWT as cookie", async done => {
		conf.jwtCookieHttpOnly = false;

		const reqId = "a-req-id";
		const username = "joelsoderstrom";
		const password = "ZlatansPonyTail";

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
			data: [{ id: "id" }],
			expectData: { username, password }
		});

		try {
			const resp = await bus.request({
				subject: constants.endpoints.http.LOGIN_WITH_COOKIE,
				skipOptionsRequest: true,
				message: {
					reqId: reqId,
					data: { username, password }
				}
			});

			expect(resp.headers["Set-Cookie"]).not.toMatch("HttpOnly;");
			conf.jwtCookieHttpOnly = true;

			done();
		} catch (err) {
			log.error(err);
			done.fail();
		}
	});

	it("should save record of active session in database when logging in", async done => {
		const reqId = "a-req-id";
		const username = "joelsoderstrom";
		const password = "ZlatansPonyTail";

		const user = {
			id: "id",
			firstName: "firstName",
			lastName: "lastName",
			email: "email"
		};

		testUtils.mockService({
			subject: UserServiceClient.endpoints.GET_USER,
			data: [user]
		});

		testUtils.mockService({
			subject: UserServiceClient.endpoints.VALIDATE_PASSWORD,
			data: [{ id: "id" }],
			expectData: { username, password }
		});

		try {
			const resp = await bus.request({
				subject: constants.endpoints.http.LOGIN_WITH_COOKIE,
				skipOptionsRequest: true,
				message: {
					reqId: reqId,
					data: { username, password }
				}
			});

			const session = await db.collection(constants.collection.SESSIONS).findOne({ userId: user.id });

			expect(session).toBeDefined("session");

			const cookies = cookie.parse(resp.headers["Set-Cookie"]);
			const jwtCookie = cookie.parse(resp.headers["Set-Cookie"])[conf.jwtCookieName];
			const decodedJWT = await jwtManager.decode(jwtCookie);

			expect(session.id).toBe(crypto.createHmac("sha512", `${decodedJWT.exp} ${user.id}`).digest("hex"));

			done();
		} catch (err) {
			log.error(err);
			done.fail();
		}
	});

	it("should return 401 if invalid username or password", async done => {
		const reqId = "a-req-id";

		bus.subscribe(UserServiceClient.endpoints.VALIDATE_PASSWORD, req => {
			return { status: 401 };
		});

		try {
			await bus.request({
				subject: constants.endpoints.http.LOGIN_WITH_COOKIE,
				skipOptionsRequest: true,
				message: {
					reqId: reqId,
					data: {
						username: "joelsoderstrom",
						password: "ZlatansPonyTail"
					}
				}
			});

			done.fail();
		} catch (err) {
			expect(err.status).toBe(401);
			expect(err.reqId).toBe(reqId);
			expect(err.headers).toBeUndefined();

			done();
		}
	});

	it("should generate web JWT token for user", async done => {
		bus.subscribe(UserServiceClient.endpoints.GET_USER, () => {
			return {
				status: 200,
				data: [{
					roles: ["admin"],
					firstName: "firstName",
					middleName: "middleName",
					lastName: "lastName",
					email: "email",
					id: "id",
				}],
				error: {},
				reqId: "reqId"
			};
		});

		try {
			const resp = await bus.request({
				subject: constants.endpoints.service.GENERATE_TOKEN_FOR_USER_COOKIE,
				skipOptionsRequest: true,
				message: {
					reqId: "reqId",
					data: { firstName: "viktor" }
				}
			});

			expect(resp.status).toBe(200);
			expect(resp.reqId).toBe("reqId");
			expect(resp.headers["Set-Cookie"]).toBeDefined();

			const jwtCookie = cookie.parse(resp.headers["Set-Cookie"])[conf.jwtCookieName];
			const decodedJWT = await jwtManager.decode(jwtCookie);

			expect(decodedJWT.id).toBe("id");
			expect(decodedJWT.firstName).toBe("firstName");
			expect(decodedJWT.lastName).toBe("lastName");
			expect(decodedJWT.email).toBe("email");
			expect(decodedJWT.exp).toBeDefined();

			done();
		} catch (err) {
			log.error(err);
			done.fail();
		}
	});

	it("should fail to generate web JWT token if user not found", async done => {
		bus.subscribe(UserServiceClient.endpoints.GET_USER, () => {
			return {
				status: 200,
				data: [],
				error: {},
				reqId: "reqId"
			};
		});

		try {
			const resp = await bus.request({
				subject: constants.endpoints.service.GENERATE_TOKEN_FOR_USER_COOKIE,
				skipOptionsRequest: true,
				message: {
					reqId: "reqId",
					data: { firstName: "does not exist" }
				}
			});

			done.fail();
		} catch (err) {
			expect(err.status).toBe(404);
			expect(err.error.code).toBe(errors.code.userNotFound);

			done();
		}
	});

	it("should fail to generate web JWT token if multiple users found", async done => {
		bus.subscribe(UserServiceClient.endpoints.GET_USER, () => {
			return {
				status: 200,
				data: [
					{ firstName: "fakeUser1" },
					{ firstName: "fakeUser2" }
				],
				error: {},
				reqId: "reqId"
			};
		});

		try {
			const resp = await bus.request({
				subject: constants.endpoints.service.GENERATE_TOKEN_FOR_USER_COOKIE,
				skipOptionsRequest: true,
				message: {
					reqId: "reqId",
					data: { firstName: "does not exist" }
				}
			});

			done.fail();
		} catch (err) {
			expect(err.status).toBe(500);
			expect(err.error.code).toBe(errors.code.unexpectedError);

			done();
		}

	});

});