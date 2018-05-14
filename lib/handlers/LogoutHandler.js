const constants = require("../../lib/constants");
const conf = require("../../conf");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const JWTManager = require("../managers/JWTManager");
const cookie = require("cookie");


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
		let isCookie = false;

		if (logoutAll && (logoutAll === "true" || logoutAll === true)) {
			await this._jwtManager.removeAllForUser(req.user.id);
		} else if (req.headers) {
			let jwtToken;

			if (req.headers.authorization) {
				jwtToken = this._getTokenFromBearer(req.headers.authorization);
			} else {
				isCookie = true;
				jwtToken = this._getTokenFromCookie(req.headers.cookie);
			}

			const decodedToken = await this._jwtManager.decode(jwtToken);
			await this._jwtManager.removeOneForUser(decodedToken.exp, req.user.id);
		}

		return {
			status: 200,
			headers: {
				"Set-Cookie": `${conf.jwtCookieName}=delete; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${conf.jwtCookieHttpOnly ? "HttpOnly;" : ""}${conf.jwtCookieDomain ? "domain=" + conf.jwtCookieDomain + ";" : ""}`
			}
		};
	}

	/**
	 * Extracts bearer token from authorization header.
	 * 
	 * @param {String} authorization 
	 */
	_getTokenFromBearer(authorization) {
		return authorization.replace("Bearer ", "");
	}

	/**
	 * Extracts the jwt token cookie from the cookie header.
	 * 
	 * @param {String} cookieHeader 
	 */
	_getTokenFromCookie(cookieHeader) {
		const cookies = cookie.parse(cookieHeader);
		return cookies[conf.jwtCookieName];
	}

}

module.exports = LogoutHandler;