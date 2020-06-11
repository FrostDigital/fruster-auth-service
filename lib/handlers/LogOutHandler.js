const { jwtCookieName, jwtCookieHttpOnly, jwtCookieDomain } = require("../../conf");
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
	async handleHttp({ user: { id: userId }, query: { logoutAll, logOutId }, user, headers }) {
		if (logOutId)
			await this._jwtManager.removeOneForUserById(logOutId, userId)
		else if (logoutAll && (logoutAll === "true" || logoutAll === "true")) {
			await this._jwtManager.removeAllForUser(user.id);
		} else if (headers) {
			let jwtToken;

			if (headers.authorization || headers.Authorization)
				jwtToken = this._getTokenFromBearer(headers.authorization || headers.Authorization);
			else
				jwtToken = this._getTokenFromCookie(headers.cookie);

			const decodedToken = await this._jwtManager.decode(jwtToken);

			await this._jwtManager.removeOneForUser(decodedToken.exp, user.id, decodedToken.salt);
		}

		if (logOutId)
			return {
				status: 200
			};
		else
			return {
				status: 200,
				headers: {
					"Set-Cookie": `${jwtCookieName}=delete; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${jwtCookieHttpOnly ? "HttpOnly;" : ""}${jwtCookieDomain ? "domain=" + jwtCookieDomain + ";" : ""}`
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
		return cookies[jwtCookieName];
	}

}

module.exports = LogoutHandler;
