const log = require("fruster-log");
const utils = require("./utils/utils");
const ms = require("ms");
const jwt = require("./utils/jwt");
const conf = require("../conf");
const BaseLoginHandler = require("./BaseLoginHandler");
const constants = require("../constants");

class CookieLogin extends BaseLoginHandler {

	constructor() {
		super();
	}

	login(userToLogin, reqId) {
		log.debug("Successfully authenticated user", userToLogin.id);

		const whitelistedUser = utils.getWhitelistedUser(userToLogin);
		const jwtToken = jwt.encode(whitelistedUser);

		return {
			status: 200,
			reqId: reqId,
			data: whitelistedUser,
			headers: {
				"Set-Cookie": this._bakeCookie(jwtToken, ms(conf.jwtCookieAge))
			}
		};
	}

	_bakeCookie(jwt, expiresInMs) {
		let d = new Date();
		d.setTime(d.getTime() + expiresInMs);
		return `${constants.jwtCookieName}=${jwt};path=/;expires=${d.toGMTString()};${conf.jwtCookieHttpOnly ? "HttpOnly;" : ""}${conf.jwtCookieDomain ? "domain=" + conf.jwtCookieDomain + ";": ""}`;
	}

}

module.exports = CookieLogin;