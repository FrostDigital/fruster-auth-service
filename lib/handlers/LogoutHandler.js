const constants = require("../../lib/constants");
const conf = require("../../conf");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const JWTManager = require("../managers/JWTManager");


class LogoutHandler {

	/**
	 * @param {JWTManager} jwtManager 
	 */
	constructor(jwtManager) {
		this._jwtManager = jwtManager;
	}

	/**
	 * @param {FrusterRequest} req 
	 */
	async handle(req) {
		const logoutAll = req.query ? req.query.logoutAll : undefined;

		if (logoutAll && logoutAll === "true") {
			await this._jwtManager.removeAllForUser(req.user.id);
		} else {
			//TODO: How to logout the current token without having access to expireDate 🤔
		}

		return {
			status: 200,
			reqId: req.reqId,
			headers: {
				"Set-Cookie": `${conf.jwtCookieName}=delete; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${conf.jwtCookieHttpOnly ? "HttpOnly;" : ""}${conf.jwtCookieDomain ? "domain=" + conf.jwtCookieDomain + ";" : ""}`
			},
			data: {}
		};
	}
}

module.exports = LogoutHandler;