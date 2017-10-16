const testUtils = require("fruster-test-utils");
const bus = require("fruster-bus");
const RefreshTokenRepo = require("../lib/repos/RefreshTokenRepo");

describe("Refresh token repo", () => {

	let repo;

	testUtils.startBeforeAll({
		mongoUrl: "mongodb://localhost:27017/refreshTokenRepo-test",
		bus: bus,
		mockNats: true,
		afterStart: (connection) => {
			repo = new RefreshTokenRepo(connection.db);
			return Promise.resolve();
		}
	});

	it("should create refresh token", (done) => {
		const ttlMs = 1000;
		const userId = "userId";

		repo.create(userId, ttlMs)
			.then(createdRefreshToken => {
				expect(createdRefreshToken._id).toBeUndefined();
				expect(createdRefreshToken.id).toBeDefined();
				expect(createdRefreshToken.token).toBeDefined();
				expect(createdRefreshToken.userId).toBe(userId);
				expect(createdRefreshToken.expired).toBe(false);
				expect(createdRefreshToken.expires.getTime()).toBeGreaterThan(Date.now());
				expect(createdRefreshToken.expires.getTime()).toBeLessThan(Date.now() + ttlMs + 1);
				done();			
			});
	});

	it("should get refresh token", (done) => {
		const ttlMs = 1000;
		const userId = "userId";

		repo.create(userId, ttlMs)
			.then(createdRefreshToken => repo.get(createdRefreshToken.token))
			.then(gottenRefreshToken => {
				expect(gottenRefreshToken.id).toBeDefined();
				expect(gottenRefreshToken.token).toBeDefined();
				expect(gottenRefreshToken.userId).toBe(userId);
				expect(gottenRefreshToken._id).toBeUndefined();
				expect(gottenRefreshToken.expires.getTime()).toBeGreaterThan(Date.now());
				expect(gottenRefreshToken.expires.getTime()).toBeLessThan(Date.now() + ttlMs + 1);
				done();			
			});
	});

	it("should expire refresh token", (done) => {
		const ttlMs = 1000;
		const userId = "userId";

		repo.create(userId, ttlMs)
			.then(createdRefreshToken => repo.expire(createdRefreshToken.token))
			.then(expiredRefreshToken => {				
				expect(expiredRefreshToken.id).toBeDefined();
				expect(expiredRefreshToken._id).toBeUndefined();
				expect(expiredRefreshToken.expired).toBe(true);				
				done();			
			});
	});

	it("should fail to expire refresh token if it does not exist", (done) => {
		const ttlMs = 1000;
		const userId = "userId";

		repo.expire("fake token")			
			.catch(err => {				
				expect(err).toEqual("Token does not exist");
				done();			
			});
	});

});