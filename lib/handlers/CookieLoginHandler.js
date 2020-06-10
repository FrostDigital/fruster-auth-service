const log = require("fruster-log");
const utils = require("../utils/utils");
const ms = require("ms");
const conf = require("../../conf");
const BaseLoginHandler = require("./BaseLoginHandler");
const constants = require("../../lib/constants");
const JWTManager = require("../managers/JWTManager");

class CookieLoginHandler extends BaseLoginHandler {

	/**
	 * @param {JWTManager} jwtManager
	 */
	constructor(jwtManager) {
		super();
		this._jwtManager = jwtManager;
		this._jwtCookieAge = ms(conf.jwtCookieAge);
	}

	/**
	 * @param {Object} userToLogin
	 * @param {String} reqId
	 */
	async login(userToLogin, reqId, sessionDetails) {
		log.debug("Successfully authenticated user", userToLogin.id);

		const whitelistedUser = utils.getWhitelistedUser(userToLogin);
		const jwtToken = await this._jwtManager.encode(whitelistedUser, this._jwtCookieAge, sessionDetails);

		return {
			status: 200,
			reqId: reqId,
			data: whitelistedUser,
			headers: {
				"Set-Cookie": this._bakeCookie(jwtToken, this._jwtCookieAge)
			}
		};
	}

	/**
	 * @param {String} jwt
	 * @param {Number} expiresInMs
	 */
	_bakeCookie(jwt, expiresInMs) {
		const date = new Date();

		date.setTime(date.getTime() + expiresInMs);

		return `${conf.jwtCookieName}=${jwt};path=/;expires=${date.toUTCString()};${conf.jwtCookieHttpOnly ? "HttpOnly;" : ""}${conf.jwtCookieDomain ? "domain=" + conf.jwtCookieDomain + ";" : ""}`;
	}

}

module.exports = CookieLoginHandler;
