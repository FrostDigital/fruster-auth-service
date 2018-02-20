const testUtils = require("fruster-test-utils");
const bus = require("fruster-bus");
const RefreshTokenRepo = require("../lib/repos/RefreshTokenRepo");
const log = require("fruster-log");


describe("Refresh token repo", () => {

	let repo;

	testUtils.startBeforeAll({
		mongoUrl: "mongodb://localhost:27017/refreshTokenRepo-test",
		bus: bus,
		mockNats: true,
		afterStart: (connection) => {
			repo = new RefreshTokenRepo(connection.db);
		}
	});

	it("should create refresh token", async done => {
		try {
			const ttlMs = 1000;
			const userId = "userId";
			const createdRefreshToken = await repo.create(userId, ttlMs);

			expect(createdRefreshToken._id).toBeUndefined();
			expect(createdRefreshToken.id).toBeDefined();
			expect(createdRefreshToken.token).toBeDefined();
			expect(createdRefreshToken.userId).toBe(userId);
			expect(createdRefreshToken.expired).toBe(false);
			expect(createdRefreshToken.expires.getTime()).toBeGreaterThan(Date.now());
			expect(createdRefreshToken.expires.getTime()).toBeLessThan(Date.now() + ttlMs + 1);

			done();
		} catch (err) {
			log.error(err);
			done.fail(err);
		}
	});

	it("should get refresh token", async done => {
		try {
			const ttlMs = 1000;
			const userId = "userId";

			const createdRefreshToken = await repo.create(userId, ttlMs);
			const gottenRefreshToken = await repo.get(createdRefreshToken.token);

			expect(gottenRefreshToken.id).toBeDefined();
			expect(gottenRefreshToken.token).toBeDefined();
			expect(gottenRefreshToken.userId).toBe(userId);
			expect(gottenRefreshToken._id).toBeUndefined();
			expect(gottenRefreshToken.expires.getTime()).toBeGreaterThan(Date.now());
			expect(gottenRefreshToken.expires.getTime()).toBeLessThan(Date.now() + ttlMs + 1);

			done();
		} catch (err) {
			log.error(err);
			done.fail(err);
		}
	});

	it("should expire refresh token", async done => {
		try {
			const ttlMs = 1000;
			const userId = "userId";

			const createdRefreshToken = await repo.create(userId, ttlMs);
			const expiredRefreshToken = await repo.expire(createdRefreshToken.token);

			expect(expiredRefreshToken.id).toBeDefined();
			expect(expiredRefreshToken._id).toBeUndefined();
			expect(expiredRefreshToken.expired).toBe(true);

			done();
		} catch (err) {
			log.error(err);
			done.fail(err);
		}
	});

	it("should fail to expire refresh token if it does not exist", async done => {
		const ttlMs = 1000;
		const userId = "userId";

		try {
			await repo.expire("fake token");
		} catch (err) {
			expect(err).toEqual("Token does not exist");
			done();
		}
	});

});