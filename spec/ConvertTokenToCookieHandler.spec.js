const bus = require("fruster-bus");
const log = require("fruster-log");
const authService = require("../auth-service");
const constants = require("../lib/constants");
const testUtils = require("fruster-test-utils");
const UserServiceClient = require("../lib/clients/UserServiceClient");
const SessionRepo = require("../lib/repos/SessionRepo");
const JWTManager = require("../lib/managers/JWTManager");


describe("ConvertTokenToCookieHandler", () => {

	/** @type {SessionRepo} */
	let sessionRepo;
	/** @type {JWTManager} */
	let jwtManager;

	testUtils.startBeforeEach({
		mongoUrl: "mongodb://localhost:27017/tokin-login-test",
		service: authService,
		bus: bus,
		mockNats: true,
		afterStart: (connection) => {
			sessionRepo = new SessionRepo(connection.db);
			jwtManager = new JWTManager(sessionRepo);

			return Promise.resolve();
		}
	});

	it("should return Set-Cookie header when converting token to cookie", async done => {
		try {
			const reqId = "a-req-id";

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

			testUtils.mockService({ subject: UserServiceClient.endpoints.VALIDATE_PASSWORD, data: { id: "id" } });

			const tokenResponse = await bus.request({
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

			const convertTokenToCookieResponse = await bus.request({
				subject: constants.endpoints.http.CONVERT_TOKEN_TO_COOKIE,
				skipOptionsRequest: true,
				message: {
					reqId: reqId,
					headers: { authorization: `Bearer ${tokenResponse.data.accessToken}` },
					user: {
						id: "id",
						roles: ["user"],
						scopes: ["user.be"]
					}
				}
			});

			expect(convertTokenToCookieResponse.status).toBe(200);
			expect(convertTokenToCookieResponse.headers["Set-Cookie"]).toContain(tokenResponse.data.accessToken);

			const decodedJWT = await jwtManager.decode(convertTokenToCookieResponse.headers["Set-Cookie"].replace("jwt=", "").substring(0, 204));

			expect(decodedJWT.id).toBe("id");
			expect(decodedJWT.exp).toBeDefined("exp");
			expect(decodedJWT.salt).toBeDefined("salt");

			done();
		} catch (err) {
			log.error(err);
			done.fail(err);
		}
	});

	it("should be possible to set redirect url", async done => {
		try {
			const reqId = "a-req-id";
			const redirect = "http://www.redirect.co.uk";

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

			testUtils.mockService({ subject: UserServiceClient.endpoints.VALIDATE_PASSWORD, data: { id: "id" } });

			const tokenResponse = await bus.request({
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

			const convertTokenToCookieResponse = await bus.request({
				subject: constants.endpoints.http.CONVERT_TOKEN_TO_COOKIE,
				skipOptionsRequest: true,
				message: {
					reqId: reqId,
					headers: { authorization: `Bearer ${tokenResponse.data.accessToken}` },
					query: { redirect },
					user: {
						id: "id",
						roles: ["user"],
						scopes: ["user.be"]
					}
				}
			});

			expect(convertTokenToCookieResponse.status).toBe(303);

			expect(convertTokenToCookieResponse.headers["Set-Cookie"]).toContain(tokenResponse.data.accessToken);
			expect(convertTokenToCookieResponse.headers.Location).toBe(redirect);

			const decodedJWT = await jwtManager.decode(convertTokenToCookieResponse.headers["Set-Cookie"].replace("jwt=", "").substring(0, 204));

			expect(decodedJWT.id).toBe("id");
			expect(decodedJWT.exp).toBeDefined("exp");
			expect(decodedJWT.salt).toBeDefined("salt");

			done();
		} catch (err) {
			log.error(err);
			done.fail(err);
		}
	});

});
