const log = require("fruster-log");
const bus = require("fruster-bus");
const mongo = require("mongodb");
const RefreshTokenRepo = require("./lib/repos/RefreshTokenRepo");

const CookieLogin = require("./lib/CookieLogin");
const TokenLogin = require("./lib/TokenLogin");
const Logout = require("./lib/Logout");
const Refresh = require("./lib/Refresh");
const DecodeToken = require("./lib/DecodeToken");
const GenerateJWTToken = require("./lib/GenerateJWTToken");

module.exports.start = function(busAddress, mongoUrl)  {
	return bus.connect(busAddress)
		.then(() => mongo.connect(mongoUrl))
		.then((db) =>  {
			let refreshTokenRepo = new RefreshTokenRepo(db);
			let logout = new Logout();
			let cookieLogin = new CookieLogin();
			let tokenLogin = new TokenLogin(refreshTokenRepo);
			let refresh = new Refresh(refreshTokenRepo);
			let generateJWTToken = new GenerateJWTToken(tokenLogin, cookieLogin);
			let decodeToken = new DecodeToken();

			bus.subscribe({
				subject: "http.post.auth.cookie",
				requestSchema: "authRequest"
			}, req => cookieLogin.handle(req));

			bus.subscribe({
				subject: "http.post.auth.token",
				requestSchema: "authRequest",
				responseSchema: "tokenAuthResponse"
			}, req => tokenLogin.handle(req));

			bus.subscribe({
				subject: "http.post.auth.web",
				requestSchema: "authRequest",
				deprectated: "Use http.post.auth.cookie instead"
			}, req => cookieLogin.handle(req));

			bus.subscribe({
				subject: "http.post.auth.app",
				requestSchema: "authRequest",
				responseSchema: "tokenAuthResponse",
				deprectated: "Use http.post.auth.token instead"
			}, req => tokenLogin.handle(req));
			
			bus.subscribe("http.post.auth.refresh", req => refresh.handle(req));
			bus.subscribe("auth-service.decode-token", req => decodeToken.handle(req));
			bus.subscribe("auth-service.generate-jwt-token-for-user.cookie", req => generateJWTToken.handle(req, true));
			bus.subscribe("auth-service.generate-jwt-token-for-user.token", req => generateJWTToken.handle(req, false));
			bus.subscribe( /* deprecated */ "auth-service.generate-jwt-token-for-user.web", req => generateJWTToken.handle(req, true));
			bus.subscribe( /* deprecated */ "auth-service.generate-jwt-token-for-user.app", req => generateJWTToken.handle(req, false));
			bus.subscribe("http.post.auth.logout", req => logout.handle(req));
		})
		.then(() => log.info("Auth service is up and running"));
};

