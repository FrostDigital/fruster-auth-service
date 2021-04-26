const Db = require("mongodb").Db;
const cookie = require("cookie");
const bus = require("fruster-bus").testBus;
const frusterTestUtils = require("fruster-test-utils");
const constants = require("../lib/constants");
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

});
