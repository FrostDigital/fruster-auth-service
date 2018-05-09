const bus = require("fruster-bus");
const cookie = require("cookie");
const log = require("fruster-log");
const JWT = require("../lib/utils/JWT");
const authService = require("../auth-service");
const conf = require("../conf");
const uuid = require("uuid");
const errors = require("../lib/errors");
const constants = require("../lib/constants");
const testUtils = require("fruster-test-utils");
const RefreshTokenRepo = require("../lib/repos/RefreshTokenRepo");
const UserServiceClient = require("../lib/clients/UserServiceClient");


describe("Generate JWT token", () => {
	let refreshTokenColl, refreshTokenRepo;

	testUtils.startBeforeEach({
		mongoUrl: "mongodb://localhost:27017/generate-jwt-token-test",
		service: authService,
		bus: bus,
		mockNats: true,
		afterStart: (connection) => {
			refreshTokenColl = connection.db.collection(constants.collection.REFRESH_TOKENS);
			refreshTokenRepo = new RefreshTokenRepo(connection.db);
		}
	});

	it("should generate JWT token for token/app auth", async done => {
		try {
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

			const resp = await bus.request({
				subject: constants.endpoints.service.GENERATE_TOKEN_FOR_USER_TOKEN,
				skipOptionsRequest: true,
				message: {
					reqId: "reqId",
					data: { firstName: "viktor" }
				}
			});

			expect(resp.status).toBe(200);
			expect(resp.reqId).toBe("reqId");
			expect(resp.data.accessToken).toBeDefined();
			expect(resp.data.refreshToken).toBeDefined();
			expect(resp.data.profile.id).toBe("id");
			expect(resp.data.profile.firstName).toBe("firstName");

			const decodedJWT = JWT.decode(resp.data.accessToken);

			expect(decodedJWT.id).toBe("id");
			expect(decodedJWT.firstName).toBe("firstName");
			expect(decodedJWT.lastName).toBe("lastName");
			expect(decodedJWT.email).toBe("email");

			const token = await refreshTokenRepo.get(resp.data.refreshToken);

			expect(token).toBeTruthy("should gotten refreshToken " + resp.data.refreshToken);
			expect(token.userId).toBe("id");
			expect(token.expires).toBeDefined();
			expect(token.expired).toBe(false);

			done();
		} catch (err) {
			log.error(err);
			done.fail(err);
		}
	});

	it("should generate JWT token for cookie/web auth", async done => {
		try {
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

			const jwtCookie = cookie.parse(resp.headers["Set-Cookie"]).jwt;
			const decodedJWT = JWT.decode(jwtCookie);

			expect(decodedJWT.id).toBe("id");
			expect(decodedJWT.firstName).toBe("firstName");
			expect(decodedJWT.lastName).toBe("lastName");
			expect(decodedJWT.email).toBe("email");
			expect(decodedJWT.exp).toBeDefined();

			done();
		} catch (err) {
			log.error(err);
			done.fail(err);
		}
	});

});