const Db = require("mongodb").Db;
const bus = require("fruster-bus").testBus;
const frusterTestUtils = require("fruster-test-utils");
const conf = require("../conf");
const mocks = require("./support/mocks");
const specConstants = require("./support/spec-constants");
const constants = require('../lib/constants');
const JWTManager = require("../lib/managers/JWTManager");
const SessionRepo = require("../lib/repos/SessionRepo");

describe("Decode and validate token", () => {

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

	it("should decode jwt token", async () => {
		const reqId = "a-req-id";
		const encodedToken = await jwtManager.encode({ user: { id: "userId" }, expiresInMs: 5000 });

		mocks.getUsers([{ id: "userId", foo: "bar" }]);

		const { data, reqId: resReqId } = await bus.request({
			subject: constants.endpoints.service.DECODE_TOKEN,
			skipOptionsRequest: true,
			message: {
				reqId: reqId,
				data: encodedToken
			}
		});

		expect(data.foo).toBe("bar");
		expect(resReqId).toBe(reqId);
	});

	it("should decode old jwt tokens", async () => {
		const reqId = "a-req-id";
		const encodedToken = await jwtManager.encode({
			user: { id: "userId" },
			expiresInMs: (-conf.accessTokenTTL) + 10
		});

		await db.collection(constants.collection.SESSIONS).remove({ userId: "userId" });

		mocks.getUsers([{ id: "userId", foo: "bar" }]);

		const { data, reqId: resReqId } = await bus.request({
			subject: constants.endpoints.service.DECODE_TOKEN,
			skipOptionsRequest: true,
			message: {
				reqId: reqId,
				data: encodedToken
			}
		});

		expect(data.foo).toBe("bar");
		expect(resReqId).toBe(reqId);
	});

	it("should fail to decode jwt token if user does not exist anymore", async done => {
		const reqId = "a-req-id";
		const encodedToken = await jwtManager.encode({ user: { id: "userId" }, expiresInMs: 5000 });

		mocks.getUsers([]);

		try {
			await bus.request({
				subject: constants.endpoints.service.DECODE_TOKEN,
				skipOptionsRequest: true,
				message: {
					reqId,
					data: encodedToken
				}
			});

			done.fail();
		} catch ({ status, reqId, error }) {
			expect(status).toBe(403);
			expect(reqId).toBe(reqId);
			expect(error.detail).toMatch("does not exist");

			done();
		}
	});

	it("should fail to decode invalid jwt token", async done => {
		const reqId = "a-req-id";
		const encodedToken = "poop";

		try {
			await bus.request({
				subject: constants.endpoints.service.DECODE_TOKEN,
				skipOptionsRequest: true,
				message: {
					reqId: reqId,
					data: encodedToken
				}
			});

			done.fail();
		} catch ({ status, reqId, error }) {
			expect(status).toBe(403);
			expect(reqId).toBe(reqId);
			expect(error.detail).toBeDefined();

			done();
		}
	});

	it("should respond with appropriate message if jwt token has expired", async done => {
		const reqId = "a-req-id";
		const encodedToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE0Nzk4NDA5ODcuMDksImlkIjoiYzFlMDk2NDEtMWJiMi00Y2E0LTg2ZGEtNzk4M2E3MmRkMmZmIiwiZmlyc3ROYW1lIjoiTSIsImxhc3ROYW1lIjoiTSIsImVtYWlsIjoibWVAbWUubWUiLCJzY29wZXMiOlsicHJvZmlsZS5nZXQiXSwicm9sZXMiOlsidXNlciJdfQ.8UBPwulAXKCkM7NAOCUL2KPz5ajkFeFIsYJU9yiQ08c";

		try {
			await bus.request({
				subject: constants.endpoints.service.DECODE_TOKEN,
				skipOptionsRequest: true,
				message: {
					reqId: reqId,
					data: encodedToken
				}
			});

			done.fail();
		} catch ({ status, reqId, error }) {
			expect(status).toBe(403);
			expect(reqId).toBe(reqId);
			expect(error.detail).toBe("Token expired");

			done();
		}
	});

	it("should fail to decode jwt token if session has ended", async done => {
		const reqId = "a-req-id";
		const user = {
			id: "userId", scopes: ["system.logout"], roles: ["user"]
		};
		const encodedToken = await jwtManager.encode({ user: { id: user.id }, expiresInMs: 5000 });

		mocks.getUsers([]);

		await bus.request({
			subject: constants.endpoints.http.LOGOUT,
			message: {
				reqId, user,
				headers: { authorization: `Bearer ${encodedToken}` }
			}
		});

		try {
			await bus.request({
				subject: constants.endpoints.service.DECODE_TOKEN,
				skipOptionsRequest: true,
				message: {
					reqId, data: encodedToken
				}
			});

			done.fail();
		} catch ({ status, reqId, error }) {
			expect(status).toBe(403);
			expect(reqId).toBe(reqId);
			expect(error.title).toBeDefined();

			done();
		}
	});

});
