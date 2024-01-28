const bus = require("fruster-bus").testBus;
const frusterTestUtils = require("fruster-test-utils");
const JWTManager = require("../lib/managers/JWTManager");
const SessionRepo = require("../lib/repos/SessionRepo");
const constants = require("../lib/constants");
const errors = require("../lib/errors");
const specConstants = require("./support/spec-constants");
const mocks = require("./support/mocks");


describe("ConvertTokenToCookieHandler", () => {

	/** @type {SessionRepo} */
	let sessionRepo;

	/** @type {JWTManager} */
	let jwtManager;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions(async ({ db }) => {
				sessionRepo = new SessionRepo(db);
				jwtManager = new JWTManager(sessionRepo);
			}));

	it("should return Set-Cookie header when converting token to cookie", async () => {
		const reqId = "a-req-id";

		mocks.getUsers([{ id: "id", firstName: "firstName", lastName: "lastName", email: "email" }])
		mocks.validatePassword();

		const tokenResponse = await bus.request({
			subject: constants.endpoints.http.LOGIN_WITH_TOKEN,
			skipOptionsRequest: true,
			message: {
				reqId: reqId,
				data: { username: "joelsoderstrom", password: "ZlatansPonyTail" }
			}
		});

		const convertTokenToCookieResponse = await bus.request({
			subject: constants.endpoints.http.CONVERT_TOKEN_TO_COOKIE,
			skipOptionsRequest: true,
			message: {
				reqId: reqId,
				headers: { authorization: `Bearer ${tokenResponse.data.accessToken}` },
				user: { id: "id", roles: ["user"], scopes: ["user.be"] }
			}
		});

		expect(convertTokenToCookieResponse.status).toBe(200);
		expect(convertTokenToCookieResponse.headers["Set-Cookie"]).toContain(tokenResponse.data.accessToken);
		expect(convertTokenToCookieResponse.headers["Content-Type"]).toBeUndefined();
		expect(convertTokenToCookieResponse.data).toBeUndefined("Response should have no data");

		const decodedJWT = await jwtManager.decode(convertTokenToCookieResponse.headers["Set-Cookie"].replace("jwt=", "").substring(0, 204));

		expect(decodedJWT.id).toBe("id");
		expect(decodedJWT.exp).toBeDefined("exp");
		expect(decodedJWT.salt).toBeDefined("salt");
	});

	it("should return Set-Cookie header when converting token in query string to cookie", async () => {
		const reqId = "a-req-id";

		mocks.getUsers([{ id: "id", firstName: "firstName", lastName: "lastName", email: "email" }])
		mocks.validatePassword();

		const tokenResponse = await bus.request({
			subject: constants.endpoints.http.LOGIN_WITH_TOKEN,
			skipOptionsRequest: true,
			message: {
				reqId: reqId,
				data: { username: "joelsoderstrom", password: "ZlatansPonyTail" }
			}
		});

		const convertTokenToCookieResponse = await bus.request({
			subject: constants.endpoints.http.CONVERT_TOKEN_TO_COOKIE,
			skipOptionsRequest: true,
			message: {
				reqId: reqId,
				user: { id: "id", roles: ["user"], scopes: ["user.be"] },
				query: {
					token: tokenResponse.data.accessToken
				}
			}
		});

		expect(convertTokenToCookieResponse.status).toBe(200);
		expect(convertTokenToCookieResponse.headers["Set-Cookie"]).toContain(tokenResponse.data.accessToken);
		expect(convertTokenToCookieResponse.headers["Content-Type"]).toBeUndefined();
		expect(convertTokenToCookieResponse.data).toBeUndefined("Response should have no data");

		const decodedJWT = await jwtManager.decode(convertTokenToCookieResponse.headers["Set-Cookie"].replace("jwt=", "").substring(0, 204));

		expect(decodedJWT.id).toBe("id");
		expect(decodedJWT.exp).toBeDefined("exp");
		expect(decodedJWT.salt).toBeDefined("salt");
	});

	it("should be possible to set redirect url", async () => {
		const reqId = "a-req-id";
		const redirect = "http://www.redirect.co.uk";

		mocks.getUsers([{ id: "id", firstName: "firstName", lastName: "lastName", email: "email" }])
		mocks.validatePassword();

		const { data: { accessToken } } = await bus.request({
			subject: constants.endpoints.http.LOGIN_WITH_TOKEN,
			skipOptionsRequest: true,
			message: {
				reqId: reqId,
				data: {
					username: "joelsoderstrom",
					password: "ZlatansPonyTail"
				}
			}
		});

		const { status, headers, data } = await bus.request({
			subject: constants.endpoints.http.CONVERT_TOKEN_TO_COOKIE,
			skipOptionsRequest: true,
			message: {
				reqId: reqId,
				headers: { authorization: `Bearer ${accessToken}` },
				query: { redirect },
				user: { id: "id", roles: ["user"], scopes: ["user.be"] }
			}
		});

		expect(status).toBe(200);

		expect(headers["Set-Cookie"]).toContain(accessToken);
		expect(headers["Content-Type"]).toBe("text/html");
		expect(data).toContain(redirect);

		const decodedJWT = await jwtManager.decode(headers["Set-Cookie"].replace("jwt=", "").substring(0, 204));

		expect(decodedJWT.id).toBe("id");
		expect(decodedJWT.exp).toBeDefined("exp");
		expect(decodedJWT.salt).toBeDefined("salt");
	});

	it("should return bad request if no authorization token provided", async done => {
		try {
			await bus.request({
				subject: constants.endpoints.http.CONVERT_TOKEN_TO_COOKIE,
				skipOptionsRequest: true,
				message: {
					reqId: "reqId",
					user: { id: "id", roles: ["user"], scopes: ["user.be"] }
				}
			});

			done.fail();
		} catch (err) {
			expect(err.status).toBe(errors.badRequest().status);
			expect(err.error.code).toBe(errors.badRequest().error.code, "err.error.code");

			done();
		}
	});

});
