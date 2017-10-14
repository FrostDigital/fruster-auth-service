const bus = require("fruster-bus");
const cookie = require("cookie");
const log = require("fruster-log");
const jwt = require("../lib/utils/jwt");
const authService = require("../auth-service");
const conf = require("../conf");
const uuid = require("uuid");
const errors = require("../errors");
const testUtils = require("fruster-test-utils");
const mocks = require("./support/mocks");

describe("Decode and validate token", () => {

	testUtils.startBeforeEach({
		mongoUrl: "mongodb://localhost:27017/auth-service-test",
		service: authService,
		bus: bus,
		mockNats: true
	});

	it("should decode jwt token", done => {
		let reqId = "a-req-id";
		let encodedToken = jwt.encode({
			id: "userId"
		});

		mocks.getUsers([{
			id: "userId",
			foo: "bar"
		}]);

		bus.request("auth-service.decode-token", {
				reqId: reqId,
				data: encodedToken
			})
			.then(resp => {
				expect(resp.data.foo).toBe("bar");
				expect(resp.reqId).toBe(reqId);
				done();
			});
	});

	it("should fail to decode jwt token if user does not exist anymore", done => {
		let reqId = "a-req-id";
		let encodedToken = jwt.encode({
			id: "userId"
		});

		mocks.getUsers([]);

		bus.request("auth-service.decode-token", {
				reqId: reqId,
				data: encodedToken
			})
			.then(done.fail)
			.catch(err => {
				expect(err.status).toBe(403);
				expect(err.reqId).toBe(reqId);
				expect(err.error.detail).toMatch("does not exist");
				
				done();
			});
	});

	it("should fail to decode invalid jwt token", done => {
		let reqId = "a-req-id";
		let encodedToken = "poop";

		bus.request("auth-service.decode-token", {
				reqId: reqId,
				data: encodedToken
			})
			.then(done.fail)
			.catch(err => {
				expect(err.status).toBe(403);
				expect(err.reqId).toBe(reqId);
				expect(err.error.detail).toBeDefined();

				done();
			});

	});

	it("should respond with appropriate message if jwt token has expired", done => {
		let reqId = "a-req-id";
		let encodedToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE0Nzk4NDA5ODcuMDksImlkIjoiYzFlMDk2NDEtMWJiMi00Y2E0LTg2ZGEtNzk4M2E3MmRkMmZmIiwiZmlyc3ROYW1lIjoiTSIsImxhc3ROYW1lIjoiTSIsImVtYWlsIjoibWVAbWUubWUiLCJzY29wZXMiOlsicHJvZmlsZS5nZXQiXSwicm9sZXMiOlsidXNlciJdfQ.8UBPwulAXKCkM7NAOCUL2KPz5ajkFeFIsYJU9yiQ08c";

		bus.request("auth-service.decode-token", {
				reqId: reqId,
				data: encodedToken
			})
			.then(done.fail)
			.catch(err => {
				expect(err.status).toBe(403);
				expect(err.reqId).toBe(reqId);
				expect(err.error.detail).toBe("Token expired");

				done();
			});

	});

});