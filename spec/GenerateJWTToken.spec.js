const Db = require("mongodb").Db;
const cookie = require("cookie");
const bus = require("fruster-bus").testBus;
const frusterTestUtils = require("fruster-test-utils");

const { jwtAdditionalPayloadSize } = require("../conf");
const constants = require("../lib/constants");
const errors = require("../lib/errors");
const RefreshTokenRepo = require("../lib/repos/RefreshTokenRepo");
const SessionRepo = require("../lib/repos/SessionRepo");
const JWTManager = require("../lib/managers/JWTManager");

const specConstants = require("./support/spec-constants");
const mocks = require("./support/mocks");


describe("Generate JWT token", () => {

	/** @type {Db} */
	let db;

	/** @type {RefreshTokenRepo} */
	let refreshTokenRepo;

	/** @type {SessionRepo} */
	let sessionRepo;

	/** @type {JWTManager} */
	let jwtManager;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions(async (connection) => {
				db = connection.db;
				refreshTokenRepo = new RefreshTokenRepo(db);

				sessionRepo = new SessionRepo(db);
				jwtManager = new JWTManager(sessionRepo);
			}));

	it("should generate JWT token for token/app auth", async () => {
		mocks.getUsers([{
			roles: ["admin"],
			firstName: "firstName",
			middleName: "middleName",
			lastName: "lastName",
			email: "email",
			id: "id",
		}]);

		const { status, reqId, data } = await bus.request({
			subject: constants.endpoints.service.GENERATE_TOKEN_FOR_USER_TOKEN,
			skipOptionsRequest: true,
			message: {
				reqId: "reqId",
				data: { firstName: "viktor" }
			}
		});

		expect(status).toBe(200);
		expect(reqId).toBe("reqId");
		expect(data.accessToken).toBeDefined();
		expect(data.refreshToken).toBeDefined();
		expect(data.profile.id).toBe("id");
		expect(data.profile.firstName).toBe("firstName");

		const decodedJWT = await jwtManager.decode(data.accessToken);

		expect(decodedJWT.id).toBe("id");
		const token = await refreshTokenRepo.get(data.refreshToken, false);

		expect(token).toBeTruthy("should gotten refreshToken " + data.refreshToken);
		expect(token.userId).toBe("id");
		expect(token.expires).toBeDefined();
		expect(token.expired).toBe(false);
	});

	it("should generate JWT token for cookie/web auth", async () => {
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

		const jwtCookie = cookie.parse(headers["Set-Cookie"]).jwt;
		const decodedJWT = await jwtManager.decode(jwtCookie);

		expect(decodedJWT.id).toBe("id");
		expect(decodedJWT.exp).toBeDefined();
	});

	it("should possible to add additional data to jwt payload", async () => {
		mocks.getUsers([{
			roles: ["admin"],
			firstName: "firstName",
			middleName: "middleName",
			lastName: "lastName",
			email: "email",
			id: "id",
		}]);

		const additionalPayload = {
			atlas: {
				accessToken: "access-token",
				refreshToken: "refresh-token",
				idToken: "id-token"
			}
		};

		const { status, reqId, headers } = await bus.request({
			subject: constants.endpoints.service.GENERATE_TOKEN_FOR_USER_COOKIE,
			skipOptionsRequest: true,
			message: {
				reqId: "reqId",
				data: {
					firstName: "viktor",
					additionalPayload
				}
			}
		});

		expect(status).toBe(200);
		expect(reqId).toBe("reqId");
		expect(headers["Set-Cookie"]).toBeDefined();

		const jwtCookie = cookie.parse(headers["Set-Cookie"]).jwt;
		const decodedJWT = await jwtManager.decode(jwtCookie);

		expect(decodedJWT.id).toBe("id");
		expect(decodedJWT.exp).toBeDefined();
		expect(decodedJWT.atlas).toEqual(additionalPayload.atlas);
	});

	it("should throw badRequest if additional payload is  very large", async () => {
		const largeString = 'x'.repeat(jwtAdditionalPayloadSize + 1);

		const additionalPayload = {
			atlas: {
				accessToken: "access-token",
				refreshToken: "refresh-token",
				idToken: largeString
			}
		};

		try {
			await bus.request({
				subject: constants.endpoints.service.GENERATE_TOKEN_FOR_USER_COOKIE,
				skipOptionsRequest: true,
				message: {
					reqId: "reqId",
					data: {
						firstName: "viktor",
						additionalPayload
					}
				}
			});

			fail();
		} catch ({ status, error }) {
			expect(status).toBe(400);
			expect(error.code).toBe(errors.badRequest().error.code);
			expect(error.detail).toBe(`Additional payload should less than ${jwtAdditionalPayloadSize}`);
		}
	});

	it("should throw badRequest if additional payload has exp property", async () => {
		try {
			await bus.request({
				subject: constants.endpoints.service.GENERATE_TOKEN_FOR_USER_COOKIE,
				skipOptionsRequest: true,
				message: {
					reqId: "reqId",
					data: {
						firstName: "viktor",
						additionalPayload: { exp: "exp" }
					}
				}
			});

			fail();
		} catch ({ status, error }) {
			expect(status).toBe(400);
			expect(error.code).toBe(errors.badRequest().error.code);
			expect(error.detail).toBe("Additional payload should should not include exp property");
		}
	});

	it("should throw badRequest if additional payload has salt property", async () => {
		try {
			await bus.request({
				subject: constants.endpoints.service.GENERATE_TOKEN_FOR_USER_COOKIE,
				skipOptionsRequest: true,
				message: {
					reqId: "reqId",
					data: {
						firstName: "viktor",
						additionalPayload: { salt: "salt" }
					}
				}
			});

			fail();
		} catch ({ status, error }) {
			expect(status).toBe(400);
			expect(error.code).toBe(errors.badRequest().error.code);
			expect(error.detail).toBe("Additional payload should should not include salt property");
		}
	});
});
