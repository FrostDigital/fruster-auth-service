const constants = require("../../lib/constants");
const conf = require("../../conf");
const FrusterRequest = require("fruster-bus").FrusterRequest;

class LogoutHandler {

	/**
	 * @param {FrusterRequest} req 
	 */
	handle(req) {
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