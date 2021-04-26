const frusterTestUtils = require("fruster-test-utils");
const RefreshTokenRepo = require("../lib/repos/RefreshTokenRepo");
const specConstants = require("./support/spec-constants");

describe("Refresh token repo", () => {

	let repo;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions(async ({ db }) => repo = new RefreshTokenRepo(db)));

	it("should create refresh token", async () => {
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
	});

	it("should get refresh token", async () => {
		const ttlMs = 1000;
		const userId = "userId";

		const createdRefreshToken = await repo.create(userId, ttlMs);
		const gottenRefreshToken = await repo.get(createdRefreshToken.token);

		expect(gottenRefreshToken.id).toBeDefined();
		expect(gottenRefreshToken.token).toBeDefined();
		expect(gottenRefreshToken.userId).toBe(userId);
		expect(gottenRefreshToken._id).toBeUndefined();
		expect(gottenRefreshToken.expires.getTime()).toBeGreaterThan(Date.now());
	});

	it("should expire refresh token", async () => {
		const ttlMs = 1000;
		const userId = "userId";

		const createdRefreshToken = await repo.create(userId, ttlMs);
		const expiredRefreshToken = await repo.expire(createdRefreshToken.token);

		expect(expiredRefreshToken.id).toBeDefined();
		expect(expiredRefreshToken._id).toBeUndefined();
		expect(expiredRefreshToken.expired).toBe(true);
	});

	it("should fail to expire refresh token if it does not exist", async done => {
		try {
			await repo.expire("fake token");
		} catch (err) {
			expect(err).toEqual("Token does not exist");
			done();
		}
	});

});
