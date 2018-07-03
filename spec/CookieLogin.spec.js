const bus = require("fruster-bus");
const cookie = require("cookie");
const log = require("fruster-log");
const authService = require("../auth-service");
const conf = require("../conf");
const errors = require("../lib/errors");
const constants = require("../lib/constants");
const testUtils = require("fruster-test-utils");
const UserServiceClient = require("../lib/clients/UserServiceClient");
const Db = require("mongodb").Db;
const JWTManager = require("../lib/managers/JWTManager");
const SessionRepo = require("../lib/repos/SessionRepo");
const crypto = require("crypto");
const SpecUtils = require("./support/SpecUtils");


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

	afterEach(() => SpecUtils.resetConfig());

	it("should login and return JWT as cookie", async done => {
		const reqId = "a-req-id";
		const username = "joelsoderstrom";
		const password = "ZlatansPonyTail";

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
			expect(decodedJWT.exp).toBeDefined();

			done();
		} catch (err) {
			log.error(err);
			done.fail();
		}
	});

	it("should use legacy get user call if custom endpoint is configured", async done => {
		try {
			const getUserSubject = "get-user-from-finland";
			conf.userServiceGetUserSubject = getUserSubject

			const username = "joelsoderstrom";
			const password = "ZlatansPonyTail";

			testUtils.mockService({
				expectRequest: (req) => {
					expect(req.data.id).toBeDefined("req.data.id");

					done();
				},
				data: { users: [{}] },
				subject: getUserSubject
			});

			testUtils.mockService({
				subject: UserServiceClient.endpoints.VALIDATE_PASSWORD,
				data: { id: "id" },
				expectData: { username, password }
			});

			await bus.request({
				subject: constants.endpoints.http.LOGIN_WITH_COOKIE,
				skipOptionsRequest: true,
				message: { reqId: "reqId", data: { username, password } }
			});
		} catch (err) {
			log.error(err);
			done.fail();
		}
	});

	it("should use updated get user call if custom endpoint is not configured", async done => {
		try {
			const username = "joelsoderstrom";
			const password = "ZlatansPonyTail";

			testUtils.mockService({
				expectRequest: (req) => {
					expect(req.data.query.id).toBeDefined("req.data.query.id");

					done();
				},
				data: { users: [{}] },
				subject: conf.userServiceGetUserSubject
			});

			testUtils.mockService({
				subject: UserServiceClient.endpoints.VALIDATE_PASSWORD,
				data: { id: "id" },
				expectData: { username, password }
			});

			await bus.request({
				subject: constants.endpoints.http.LOGIN_WITH_COOKIE,
				skipOptionsRequest: true,
				message: { reqId: "reqId", data: { username, password } }
			});
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

	it("should login and return a user profile", async done => {
		const reqId = "a-req-id";
		const username = "joelsoderstrom";
		const password = "ZlatansPonyTail";
		const userData = {
			id: "id",
			email: "email",
			profile: {
				firstName: "firstName",
				lastName: "lastName",
				thisShouldNotBeReturned: "ok!"
			}
		};

		testUtils.mockService({
			subject: UserServiceClient.endpoints.GET_USER,
			data: {
				users: [userData],
				totalCount: 1
			}
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

			expect(resp.data.email).toBe(userData.email, "resp.data.email");
			expect(resp.data.id).toBe(userData.id, "resp.data.id");
			expect(resp.data.profile.firstName).toBe(userData.profile.firstName, "resp.data.profile.firstName");
			expect(resp.data.profile.lastName).toBe(userData.profile.lastName, "resp.data.profile.lastName");
			expect(resp.data.profile.thisShouldNotBeReturned).toBeUndefined("resp.data.profile.thisShouldNotBeReturned");

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
			data: {
				users: [user],
				totalCount: 1
			}
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

			const jwtCookie = cookie.parse(resp.headers["Set-Cookie"])[conf.jwtCookieName];
			const decodedJWT = await jwtManager.decode(jwtCookie);

			expect(session.id).toBe(crypto.createHmac("sha512", `${decodedJWT.exp} ${user.id}${decodedJWT.salt}`).digest("hex"));

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

	it("should generate cookie JWT token for user", async done => {
		bus.subscribe(UserServiceClient.endpoints.GET_USER, () => {
			return {
				status: 200,
				data: {
					users: [{
						roles: ["admin"],
						firstName: "firstName",
						middleName: "middleName",
						lastName: "lastName",
						email: "email",
						id: "id",
					}],
					totalCount: 1
				},
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
			expect(decodedJWT.exp).toBeDefined();

			done();
		} catch (err) {
			log.error(err);
			done.fail();
		}
	});

	it("should fail to generate cookie JWT token if user not found", async done => {
		bus.subscribe(UserServiceClient.endpoints.GET_USER, () => {
			return {
				status: 200,
				data: {
					users: [],
					totalCount: 0
				},
				error: {},
				reqId: "reqId"
			};
		});

		try {
			await bus.request({
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

	it("should fail to generate cookie JWT token if multiple users found", async done => {
		bus.subscribe(UserServiceClient.endpoints.GET_USER, () => {
			return {
				status: 200,
				data: {
					users: [
						{ firstName: "fakeUser1" },
						{ firstName: "fakeUser2" }
					],
					totalCount: 2
				},
				error: {},
				reqId: "reqId"
			};
		});

		try {
			await bus.request({
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