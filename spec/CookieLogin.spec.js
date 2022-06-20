const crypto = require("crypto");
const cookie = require("cookie");
const Db = require("mongodb").Db;
const bus = require("fruster-bus").testBus;
const frusterTestUtils = require("fruster-test-utils");
const conf = require("../conf");
const errors = require("../lib/deprecatedErrors");
const constants = require("../lib/constants");
const UserServiceClient = require("../lib/clients/UserServiceClient");
const JWTManager = require("../lib/managers/JWTManager");
const SessionRepo = require("../lib/repos/SessionRepo");
const SpecUtils = require("./support/SpecUtils");
const specConstants = require("./support/spec-constants");
const mocks = require("./support/mocks");
const log = require("fruster-log");

describe("Cookie login", () => {

	/** @type {Db} */
	let db;

	/** @type {SessionRepo} */
	let sessionRepo;

	/** @type {JWTManager} */
	let jwtManager;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions(async (connection) => {
				db = connection.db;
				sessionRepo = new SessionRepo(db);
				jwtManager = new JWTManager(sessionRepo);
			}));

	afterEach(() => SpecUtils.resetConfig());

	it("should login and return JWT as cookie", async () => {
		const reqId = "a-req-id";
		const username = "joelsoderstrom";
		const password = "ZlatansPonyTail";

		mocks.getUsers([{ id: "id", firstName: "firstName", lastName: "lastName", email: "email" }])
		mocks.validatePassword();

		const { status, reqId: resReqId, headers } = await bus.request({
			subject: constants.endpoints.http.LOGIN_WITH_COOKIE,
			skipOptionsRequest: true,
			message: {
				reqId: reqId,
				data: { username, password }
			}
		});

		expect(status).toBe(200);
		expect(resReqId).toBe(reqId);
		expect(headers["Set-Cookie"]).toBeDefined();
		expect(headers["Set-Cookie"]).not.toMatch("domain");
		expect(headers["Set-Cookie"]).toMatch("HttpOnly;");

		const jwtCookie = cookie.parse(headers["Set-Cookie"])[conf.jwtCookieName];
		const decodedJWT = await jwtManager.decode(jwtCookie);

		expect(decodedJWT.id).toBe("id");
		expect(decodedJWT.exp).toBeDefined();
	});

	it("should use legacy get user call if custom endpoint is configured", async () => {
		const getUserSubject = "get-user-from-finland";
		conf.userServiceGetUserSubject = getUserSubject

		const username = "joelsoderstrom";
		const password = "ZlatansPonyTail";

		frusterTestUtils.mockService({
			subject: getUserSubject,
			response: ({ data }) => {
				expect(data.id).toBeDefined("req.data.id");

				return { status: 200, data: { users: [{}] } };
			}
		});

		mocks.validatePassword();

		await bus.request({
			subject: constants.endpoints.http.LOGIN_WITH_COOKIE,
			skipOptionsRequest: true,
			message: { reqId: "reqId", data: { username, password } }
		});
	});

	it("should use updated get user call if custom endpoint is not configured", async () => {
		const username = "joelsoderstrom";
		const password = "ZlatansPonyTail";

		frusterTestUtils.mockService({
			subject: conf.userServiceGetUserSubject,
			response: ({ data }) => {
				expect(data.query.id).toBeDefined("req.data.query.id");

				return { data: { users: [{}] } };
			}
		});

		mocks.validatePassword();

		await bus.request({
			subject: constants.endpoints.http.LOGIN_WITH_COOKIE,
			skipOptionsRequest: true,
			message: { reqId: "reqId", data: { username, password } }
		});
	});

	it("should login and return a non HttpOnly JWT as cookie", async () => {
		conf.jwtCookieHttpOnly = false;

		const reqId = "a-req-id";
		const username = "joelsoderstrom";
		const password = "ZlatansPonyTail";

		mocks.getUsers([{ id: "id", firstName: "firstName", lastName: "lastName", email: "email" }])
		mocks.validatePassword();

		const { headers } = await bus.request({
			subject: constants.endpoints.http.LOGIN_WITH_COOKIE,
			skipOptionsRequest: true,
			message: {
				reqId: reqId,
				data: { username, password }
			}
		});

		expect(headers["Set-Cookie"]).not.toMatch("HttpOnly;");
		conf.jwtCookieHttpOnly = true;
	});

	it("should login and return a user profile", async () => {
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

		mocks.getUsers([userData])
		mocks.validatePassword();

		const { data } = await bus.request({
			subject: constants.endpoints.http.LOGIN_WITH_COOKIE,
			skipOptionsRequest: true,
			message: {
				reqId: reqId,
				data: { username, password }
			}
		});

		expect(data.email).toBe(userData.email, "data.email");
		expect(data.id).toBe(userData.id, "data.id");
		expect(data.profile.firstName).toBe(userData.profile.firstName, "data.profile.firstName");
		expect(data.profile.lastName).toBe(userData.profile.lastName, "data.profile.lastName");
		expect(data.profile.thisShouldNotBeReturned).toBeUndefined("data.profile.thisShouldNotBeReturned");
	});

	it("should save record of active session in database when logging in", async () => {
		const reqId = "a-req-id";
		const username = "joelsoderstrom";
		const password = "ZlatansPonyTail";

		const user = {
			id: "id",
			firstName: "firstName",
			lastName: "lastName",
			email: "email"
		};

		mocks.getUsers([user]);
		mocks.validatePassword();

		const { headers } = await bus.request({
			subject: constants.endpoints.http.LOGIN_WITH_COOKIE,
			skipOptionsRequest: true,
			message: {
				reqId: reqId,
				data: { username, password }
			}
		});

		const session = await db.collection(constants.collection.SESSIONS).findOne({ userId: user.id });

		expect(session).toBeDefined("session");

		const jwtCookie = cookie.parse(headers["Set-Cookie"])[conf.jwtCookieName];
		const decodedJWT = await jwtManager.decode(jwtCookie);

		expect(session.id).toBe(crypto.createHmac("sha512", `${decodedJWT.exp} ${user.id}${decodedJWT.salt}`).digest("hex"));
	});

	it("should save session details in session on login", async done => {
		const reqId = "a-req-id";
		const username = "joelsoderstrom";
		const password = "ZlatansPonyTail";
		const userAgent = "wellbee%20Test/1184 CFNetwork/1125.2 Darwin/19.4.0";
		const version = "13.4.1";

		const user = {
			id: "id",
			firstName: "firstName",
			lastName: "lastName",
			email: "email"
		};

		const mockValidatePassword = frusterTestUtils.mockService({
			subject: UserServiceClient.endpoints.VALIDATE_PASSWORD,
			response: {
				data: { id: user.id }
			}
		});

		const mockGetUsersByQuery = frusterTestUtils.mockService({
			subject: UserServiceClient.endpoints.GET_USERS_BY_QUERY,
			response: {
				data: {
					users: [user],
					totalCount: 1
				}
			}
		});

		try {
			const resp = await bus.request({
				subject: constants.endpoints.http.LOGIN_WITH_COOKIE,
				message: {
					reqId: reqId,
					data: { username, password },
					headers: {
						"user-agent": userAgent,
						version
					}
				}
			});

			expect(mockValidatePassword.requests[0].data.username).toBe(username, "mockValidatePassword.requests[0].data.username");
			expect(mockValidatePassword.requests[0].data.password).toBe(password, "mockValidatePassword.requests[0].data.password");

			expect(mockGetUsersByQuery.requests[0].data.query.id).toBe(user.id, "mockGetUsersByQuery.requests[0].data.query.id");

			const session = await db.collection(constants.collection.SESSIONS).findOne({ userId: user.id });

			expect(session).toBeDefined("session");
			expect(session.sessionDetails.userAgent).toBe(userAgent, "session.sessionDetails.userAgent");
			expect(session.sessionDetails.version).toBe(version, "session.sessionDetails.version");
			expect(session.sessionDetails.created).toBeDefined("session.sessionDetails.created");

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

		frusterTestUtils.mockService({
			subject: UserServiceClient.endpoints.VALIDATE_PASSWORD,
			response: { status: 401 }
		})

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

	it("should generate cookie JWT token for user", async () => {
		mocks.getUsers([{
			roles: ["admin"],
			firstName: "firstName",
			middleName: "middleName",
			lastName: "lastName",
			email: "email",
			id: "id",
		}]);

		const { status, reqId, headers } = await bus.request({
			subject: constants.endpoints.service.GENERATE_TOKEN_FOR_USER_COOKIE,
			skipOptionsRequest: true,
			message: {
				reqId: "reqId",
				data: { firstName: "viktor" }
			}
		});

		expect(status).toBe(200);
		expect(reqId).toBe("reqId");
		expect(headers["Set-Cookie"]).toBeDefined();

		const jwtCookie = cookie.parse(headers["Set-Cookie"])[conf.jwtCookieName];
		const decodedJWT = await jwtManager.decode(jwtCookie);

		expect(decodedJWT.id).toBe("id");
		expect(decodedJWT.exp).toBeDefined();
	});

	it("should fail to generate cookie JWT token if user not found", async done => {
		mocks.getUsers([]);

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
		} catch ({ status, error }) {
			expect(status).toBe(404);
			expect(error.code).toBe(errors.code.userNotFound);

			done();
		}
	});

	it("should fail to generate cookie JWT token if multiple users found", async done => {
		mocks.getUsers([{ firstName: "fakeUser1" }, { firstName: "fakeUser2" }]);

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
		} catch ({ status, error }) {
			expect(status).toBe(500);
			expect(error.code).toBe(errors.code.unexpectedError);

			done();
		}

	});

	it("should login and return JWT as cookie for additional query", async () => {
		const reqId = "a-req-id";
		const username = "joelsoderstrom";
		const password = "ZlatansPonyTail";

		mocks.getUsers([{ id: "id", firstName: "firstName", lastName: "lastName", email: "email" }])
		mocks.validatePassword();

		const { status, reqId: resReqId, headers } = await bus.request({
			subject: constants.endpoints.http.LOGIN_WITH_COOKIE,
			skipOptionsRequest: true,
			message: {
				reqId: reqId,
				data: {
					username,
					password,
					"organisation.id": "org-id"
				}
			}
		});

		expect(status).toBe(200);
		expect(resReqId).toBe(reqId);
		expect(headers["Set-Cookie"]).toBeDefined();
		expect(headers["Set-Cookie"]).not.toMatch("domain");
		expect(headers["Set-Cookie"]).toMatch("HttpOnly;");

		const jwtCookie = cookie.parse(headers["Set-Cookie"])[conf.jwtCookieName];
		const decodedJWT = await jwtManager.decode(jwtCookie);

		expect(decodedJWT.id).toBe("id");
		expect(decodedJWT.exp).toBeDefined();
	});

	it("deactivated user cannot login", async () => {
		conf.deactivatedUserCanLogin = false;
		mocks.getUsers([{ id: "id", firstName: "firstName", lastName: "lastName", email: "email", deactivated: new Date() }])
		mocks.validatePassword();

		try {
			await bus.request({
				subject: constants.endpoints.http.LOGIN_WITH_COOKIE,
				skipOptionsRequest: true,
				message: {
					reqId:"reqId",
					data: {
						username: "username",
						password: "password"
					}
				}
			});
		} catch (err) {
			expect(err.status).toBe(403);
			expect(err.error.code).toBe("auth-service.403.2");
			return;
		}
		fail("Expected error to be thrown");
	});

});
