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
		mongoUrl: "mongodb://localhost:27017/auth-service-test",
		service: authService,
		bus: bus
	});


	it("should login and return JWT as cookie", done => {
		var reqId = "a-req-id";
		var username = "joelsoderstrom";
		var password = "ZlatansPonyTail";

		bus.subscribe("user-service.validate-password", req => {
			expect(req.data.username).toBe(username);
			expect(req.data.password).toBe(password);

			return {
				status: 200,
				data: {
					"id": "id",
					"firstName": "firstName",
					"lastName": "lastName",
					"email": "email"
				}
			};
		});

		bus.request("http.post.auth.web", {
				reqId: reqId,
				data: {
					username: username,
					password: password
				}
			})
			.then(resp => {
				expect(resp.status).toBe(200);
				expect(resp.reqId).toBe(reqId);
				expect(resp.headers["Set-Cookie"]).toBeDefined();
				expect(resp.headers["Set-Cookie"]).not.toMatch("domain");
				expect(resp.headers["Set-Cookie"]).toMatch("HttpOnly;");

				let jwtCookie = cookie.parse(resp.headers["Set-Cookie"]).jwt;
				let decodedJWT = jwt.decode(jwtCookie);
				
				expect(decodedJWT.id).toBe("id");
				expect(decodedJWT.firstName).toBe("firstName");
				expect(decodedJWT.lastName).toBe("lastName");
				expect(decodedJWT.email).toBe("email");
				expect(decodedJWT.exp).toBeDefined();

				// Check that cookie expiration and jwt token expiration is roughly the same
				let cookieExp = new Date(cookie.parse(resp.headers["Set-Cookie"]).expires);
				let jwtExp = new Date(decodedJWT.exp * 1000);
				expect(Math.round(cookieExp.getTime()/10000)).toEqual(Math.round(jwtExp.getTime()/10000))

				done();
			})
			.catch(done.fail);
	});

	it("should login and return a non HttpOnly JWT as cookie", done => {
		conf.jwtCookieHttpOnly = false;

		var reqId = "a-req-id";
		var username = "joelsoderstrom";
		var password = "ZlatansPonyTail";

		bus.subscribe("user-service.validate-password", req => {
			return {
				status: 200,
				data: {
					"id": "id",
					"firstName": "firstName",
					"lastName": "lastName",
					"email": "email"
				}
			};
		});

		bus.request("http.post.auth.web", {
				reqId: reqId,
				data: {
					username: username,
					password: password
				}
			})
			.then(resp => {
				expect(resp.headers["Set-Cookie"]).not.toMatch("HttpOnly;");
				conf.jwtCookieHttpOnly = true;
				done();
			})
			.catch(done.fail);
	});

	it("should return 401 if invalid username or password", done => {
		var reqId = "a-req-id";

		bus.subscribe("user-service.validate-password", req => {
			return {
				status: 401
			};
		});

		bus.request("http.post.auth.web", {
				reqId: reqId,
				data: {
					username: "joelsoderstrom",
					password: "ZlatansPonyTail"
				}
			})
			.then(done.fail)
			.catch(error => {
				expect(error.status).toBe(401);
				expect(error.reqId).toBe(reqId);
				expect(error.headers).toBeUndefined();
				done();
			});
	});

	it("should generate web JWT token for user", done => {
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

		bus.request("auth-service.generate-jwt-token-for-user.web", {
				reqId: "reqId",
				data: {
					firstName: "viktor"
				}
			})
			.then(resp => {
				expect(resp.status).toBe(200);
				expect(resp.reqId).toBe("reqId");
				expect(resp.headers["Set-Cookie"]).toBeDefined();

				let jwtCookie = cookie.parse(resp.headers["Set-Cookie"]).jwt;
				let decodedJWT = jwt.decode(jwtCookie);

				expect(decodedJWT.id).toBe("id");
				expect(decodedJWT.firstName).toBe("firstName");
				expect(decodedJWT.lastName).toBe("lastName");
				expect(decodedJWT.email).toBe("email");
				expect(decodedJWT.exp).toBeDefined();

				done();
			});
	});

	it("should fail to generate web JWT token if user not found", done => {
		bus.subscribe(conf.userServiceGetUserSubject, () => {
			return {
				"status": 200,
				"data": [],
				"error": {},
				"reqId": "reqId"
			};
		});

		bus.request("auth-service.generate-jwt-token-for-user.web", {
				reqId: "reqId",
				data: {
					firstName: "does not exist"
				}
			})
			.catch(resp => {
				expect(resp.status).toBe(404);
				expect(resp.error.code).toBe(errors.code.userNotFound);
				done();
			});
	});

	it("should fail to generate web JWT token if multiple users found", done => {
		bus.subscribe(conf.userServiceGetUserSubject, () => {
			return {
				"status": 200,
				"data": [{
					firstName: "fakeUser1"
				}, {
					firstName: "fakeUser2"
				}],
				"error": {},
				"reqId": "reqId"
			};
		});

		bus.request("auth-service.generate-jwt-token-for-user.web", {
				reqId: "reqId",
				data: {
					firstName: "does not exist"
				}
			})
			.catch(resp => {
				expect(resp.status).toBe(500);
				expect(resp.error.code).toBe(errors.code.unexpectedError);
				done();
			});
	});


});