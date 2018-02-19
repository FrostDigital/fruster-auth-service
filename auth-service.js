const log = require("fruster-log");
const bus = require("fruster-bus");
const mongo = require("mongodb");
const constants = require("./constants");

const RefreshTokenRepo = require("./lib/repos/RefreshTokenRepo");
const CookieLogin = require("./lib/CookieLogin");
const TokenLogin = require("./lib/TokenLogin");
const Logout = require("./lib/Logout");
const Refresh = require("./lib/Refresh");
const DecodeToken = require("./lib/DecodeToken");
const GenerateJWTToken = require("./lib/GenerateJWTToken");

module.exports.start = async (busAddress, mongoUrl) => {
	await bus.connect(busAddress);
	const db = await mongo.connect(mongoUrl);

	const refreshTokenRepo = new RefreshTokenRepo(db);
	const logout = new Logout();
	const cookieLogin = new CookieLogin();
	const tokenLogin = new TokenLogin(refreshTokenRepo);
	const refresh = new Refresh(refreshTokenRepo);
	const generateJWTToken = new GenerateJWTToken(tokenLogin, cookieLogin);
	const decodeToken = new DecodeToken();


	bus.subscribe(constants.endpoints.http.LOGIN_WITH_COOKIE, (req) => cookieLogin.handle(req));
	bus.subscribe(constants.endpoints.http.LOGIN_WITH_TOKEN, (req) => tokenLogin.handle(req));
	bus.subscribe( /* deprecated */ "http.post.auth.web", (req) => cookieLogin.handle(req));
	bus.subscribe( /* deprecated */ "http.post.auth.app", (req) => tokenLogin.handle(req));
	bus.subscribe(constants.endpoints.http.REFRESH_AUTH, (req) => refresh.handle(req));
	bus.subscribe(constants.endpoints.http.LOGOUT, (req) => logout.handle(req));


	bus.subscribe(constants.endpoints.service.DECODE_TOKEN, (req) => decodeToken.handle(req));
	bus.subscribe(constants.endpoints.service.GENERATE_TOKEN_FOR_USER_COOKIE, (req) => generateJWTToken.handle(req, true));
	bus.subscribe(constants.endpoints.service.GENERATE_TOKEN_FOR_USER_TOKEN, (req) => generateJWTToken.handle(req, false));
	bus.subscribe( /* deprecated */ "auth-service.generate-jwt-token-for-user.web", (req) => generateJWTToken.handle(req, true));
	bus.subscribe( /* deprecated */ "auth-service.generate-jwt-token-for-user.app", (req) => generateJWTToken.handle(req, false));

	/**
	 * HTTP
	 */
	bus.subscribe({
		subject: constants.endpoints.http.LOGIN_WITH_COOKIE,
		requestSchema: "authRequest"
	}, req => cookieLogin.handle(req));

	bus.subscribe({
		subject: constants.endpoints.http.LOGIN_WITH_TOKEN,
		requestSchema: "authRequest",
		responseSchema: "tokenAuthResponse"
	}, req => tokenLogin.handle(req));

	bus.subscribe({
		subject: "http.post.auth.web",
		requestSchema: "authRequest",
		deprecated: `Use ${constants.endpoints.http.LOGIN_WITH_COOKIE} instead`
	}, req => cookieLogin.handle(req));

	bus.subscribe({
		subject: "http.post.auth.app",
		requestSchema: "authRequest",
		responseSchema: "tokenAuthResponse",
		deprecated: `Use ${constants.endpoints.http.LOGIN_WITH_TOKEN} instead`
	}, req => tokenLogin.handle(req));

	bus.subscribe(constants.endpoints.http.REFRESH_AUTH, req => refresh.handle(req));
	bus.subscribe(constants.endpoints.http.LOGOUT, req => logout.handle(req));

	/**
	 * SERVICE
	 */
	bus.subscribe(constants.endpoints.service.DECODE_TOKEN, req => decodeToken.handle(req));
	bus.subscribe(constants.endpoints.service.GENERATE_TOKEN_FOR_USER_COOKIE, req => generateJWTToken.handle(req, true));
	bus.subscribe(constants.endpoints.service.GENERATE_TOKEN_FOR_USER_TOKEN, req => generateJWTToken.handle(req, false));
	bus.subscribe( /* deprecated */ "auth-service.generate-jwt-token-for-user.web", req => generateJWTToken.handle(req, true));
	bus.subscribe( /* deprecated */ "auth-service.generate-jwt-token-for-user.app", req => generateJWTToken.handle(req, false));

	log.info("Auth service is up and running")
};

