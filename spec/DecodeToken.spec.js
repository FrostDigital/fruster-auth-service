const bus = require("fruster-bus");
const cookie = require("cookie");
const log = require("fruster-log");
const JWT = require("../lib/utils/JWT");
const authService = require("../auth-service");
const conf = require("../conf");
const uuid = require("uuid");
const errors = require("../lib/errors");
const testUtils = require("fruster-test-utils");
const mocks = require("./support/mocks");
const constants = require('../lib/constants');
const Db = require("mongodb").Db;
const JWTManager = require("../lib/managers/JWTManager");
const JWTTokenRepo = require("../lib/repos/JWTTokenRepo");


describe("Decode and validate token", () => {

	/** @type {Db} */
	let db;

	/** @type {JWTTokenRepo} */
	let jwtTokenRepo;

	/** @type {JWTManager} */
	let jwtManager;

	testUtils.startBeforeEach({
		mongoUrl: "mongodb://localhost:27017/decode-token-test",
		service: authService,
		bus: bus,
		mockNats: true,
		afterStart: connection => {
			db = connection.db;
			jwtTokenRepo = new JWTTokenRepo(db);
			jwtManager = new JWTManager(jwtTokenRepo);
		}
	});

	it("should decode jwt token", async done => {
		try {
			const reqId = "a-req-id";
			const encodedToken = await jwtManager.encode({ id: "userId" }, 5000);

			mocks.getUsers([{ id: "userId", foo: "bar" }]);

			const resp = await bus.request({
				subject: constants.endpoints.service.DECODE_TOKEN,
				skipOptionsRequest: true,
				message: {
					reqId: reqId,
					data: encodedToken
				}
			});

			expect(resp.data.foo).toBe("bar");
			expect(resp.reqId).toBe(reqId);

			done();
		} catch (err) {
			log.error(err);
			done.fail(err);
		}
	});

	it("should fail to decode jwt token if user does not exist anymore", async done => {
		try {
			const reqId = "a-req-id";
			const encodedToken = await jwtManager.encode({ id: "userId" }, 5000);

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
			} catch (err) {
				expect(err.status).toBe(403);
				expect(err.reqId).toBe(reqId);
				expect(err.error.detail).toMatch("does not exist");

				done();
			}
		} catch (err) {
			log.error(err);
			done.fail(err);
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
		} catch (err) {
			expect(err.status).toBe(403);
			expect(err.reqId).toBe(reqId);
			expect(err.error.detail).toBeDefined();

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
		} catch (err) {
			expect(err.status).toBe(403);
			expect(err.reqId).toBe(reqId);
			expect(err.error.detail).toBe("Token expired");

			done();
		}
	});

});