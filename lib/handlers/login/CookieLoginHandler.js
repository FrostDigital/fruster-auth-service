const log = require("fruster-log");
const utils = require("../../utils/utils");
const ms = require("ms");
const conf = require("../../../conf");
const BaseLoginHandler = require(".././login/BaseLoginHandler");
const JWTManager = require("../../managers/JWTManager");


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
	 * @override
	 * 
	 * @param {Object} userToLogin 
	 * @param {String} reqId 
	 */
	async login(userToLogin, reqId) {
		log.debug("Successfully authenticated user", userToLogin.id);

		const whitelistedUser = utils.getWhitelistedUser(userToLogin);
		const jwtToken = await this._jwtManager.encode({ id: userToLogin.id }, this._jwtCookieAge);

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