const bus = require("fruster-bus"),
	cookie = require("cookie"),
	log = require("fruster-log"),
	jwt = require("../lib/utils/jwt"),
	authService = require("../auth-service"),
	conf = require("../conf"),
	uuid = require("uuid"),
	errors = require("../errors"),
	constants = require("../constants"),
	testUtils = require("fruster-test-utils");

describe("Cookie login", () => {

	testUtils.startBeforeEach({
		mongoUrl: "mongodb://localhost:27017/cookie-login-test",
		service: authService,
		bus: bus,
		mockNats: true
	});


	it("should login and return JWT as cookie", async done => {
		const reqId = "a-req-id";
		const username = "joelsoderstrom";
		const password = "ZlatansPonyTail";

		testUtils.mockService({
			subject: conf.userServiceGetUserSubject,
			data: [{
				id: "id", firstName: "firstName", lastName: "lastName", email: "email"
			}],
			expectMaxInvocation: 1
		});

		testUtils.mockService({
			subject: "user-service.validate-password",
			data: [{ id: "id" }],
			expectMaxInvocation: 1,
			expectData: {
				username, password
			}
		});

		try {
			const resp = await bus.request("http.post.auth.web", {
				reqId: reqId,
				data: {
					username, password
				}
			});

			expect(resp.status).toBe(200);
			expect(resp.reqId).toBe(reqId);
			expect(resp.headers["Set-Cookie"]).toBeDefined();
			expect(resp.headers["Set-Cookie"]).not.toMatch("domain");
			expect(resp.headers["Set-Cookie"]).toMatch("HttpOnly;");

			const jwtCookie = cookie.parse(resp.headers["Set-Cookie"]).jwt;
			const decodedJWT = jwt.decode(jwtCookie);

			expect(decodedJWT.id).toBe("id");
			expect(decodedJWT.firstName).toBe("firstName");
			expect(decodedJWT.lastName).toBe("lastName");
			expect(decodedJWT.email).toBe("email");
			expect(decodedJWT.exp).toBeDefined();

			done();
		} catch (err) {
			log.error(err);
			done.fail();
		}
	});

	it("should login and return a non HttpOnly JWT as cookie", async done => {
		conf.jwtCookieHttpOnly = false;

		const reqId = "a-req-id";
		const username = "joelsoderstrom";
		const password = "ZlatansPonyTail";

		testUtils.mockService({
			subject: conf.userServiceGetUserSubject,
			data: [{
				id: "id", firstName: "firstName", lastName: "lastName", email: "email"
			}],
			expectMaxInvocation: 1
		});

		testUtils.mockService({
			subject: "user-service.validate-password",
			data: [{ id: "id" }],
			expectMaxInvocation: 1,
			expectData: {
				username, password
			}
		});

		try {
			const resp = await bus.request("http.post.auth.web", {
				reqId: reqId,
				data: {
					username, password
				}
			});

			expect(resp.headers["Set-Cookie"]).not.toMatch("HttpOnly;");
			conf.jwtCookieHttpOnly = true;

			done();
		} catch (err) {
			log.error(err);
			done.fail();
		}
	});

	it("should return 401 if invalid username or password", async done => {
		const reqId = "a-req-id";

		bus.subscribe("user-service.validate-password", req => {
			return { status: 401 };
		});

		try {
			await bus.request("http.post.auth.web", {
				reqId: reqId,
				data: {
					username: "joelsoderstrom", password: "ZlatansPonyTail"
				}
			});

			done.fail();
		} catch (err) {
			expect(err.status).toBe(401);
			expect(err.reqId).toBe(reqId);
			expect(err.headers).toBeUndefined();
			done();
		}

	});

	it("should generate web JWT token for user", async done => {
		bus.subscribe(conf.userServiceGetUserSubject, () => {
			return {
				"status": 200,
				"data": [{
					"roles": [
						"admin"
					],
					"firstName": "firstName",
					"middleName": "middleName",
					"lastName": "lastName",
					"email": "email",
					"id": "id",
				}],
				"error": {},
				"reqId": "reqId"
			};
		});

		try {
			const resp = await bus.request("auth-service.generate-jwt-token-for-user.web", {
				reqId: "reqId",
				data: {
					firstName: "viktor"
				}
			});

			expect(resp.status).toBe(200);
			expect(resp.reqId).toBe("reqId");
			expect(resp.headers["Set-Cookie"]).toBeDefined();

			const jwtCookie = cookie.parse(resp.headers["Set-Cookie"]).jwt;
			const decodedJWT = jwt.decode(jwtCookie);

			expect(decodedJWT.id).toBe("id");
			expect(decodedJWT.firstName).toBe("firstName");
			expect(decodedJWT.lastName).toBe("lastName");
			expect(decodedJWT.email).toBe("email");
			expect(decodedJWT.exp).toBeDefined();

			done();
		} catch (err) {
			log.error(err);
			done.fail();
		}
	});

	it("should fail to generate web JWT token if user not found", async done => {
		bus.subscribe(conf.userServiceGetUserSubject, () => {
			return {
				"status": 200,
				"data": [],
				"error": {},
				"reqId": "reqId"
			};
		});

		try {
			const resp = await bus.request("auth-service.generate-jwt-token-for-user.web", {
				reqId: "reqId",
				data: {
					firstName: "does not exist"
				}
			});

			done.fail();
		} catch (err) {
			expect(err.status).toBe(404);
			expect(err.error.code).toBe(errors.code.userNotFound);
			done();
		}
	});

	it("should fail to generate web JWT token if multiple users found", async done => {
		bus.subscribe(conf.userServiceGetUserSubject, () => {
			return {
				"status": 200,
				"data": [
					{ firstName: "fakeUser1" },
					{ firstName: "fakeUser2" }
				],
				"error": {},
				"reqId": "reqId"
			};
		});
		try {
			const resp = await bus.request("auth-service.generate-jwt-token-for-user.web", {
				reqId: "reqId",
				data: { firstName: "does not exist" }
			});

			done.fail();
		} catch (err) {
			expect(err.status).toBe(500);
			expect(err.error.code).toBe(errors.code.unexpectedError);
			done();
		}

	});


});