const constants = require("../constants");
const conf = require("../conf");
const FrusterRequest = require("fruster-bus").FrusterRequest;

class Logout {

	/**
	 * @param {FrusterRequest} req 
	 */
	handle(req) {
		return {
			status: 200,
			reqId: req.reqId,
			headers: {
				"Set-Cookie": `${constants.jwtCookieName}=delete; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${conf.jwtCookieHttpOnly ? "HttpOnly;" : ""}${conf.jwtCookieDomain ? "domain=" + conf.jwtCookieDomain + ";" : ""}`
			},
			data: {}
		};
	}
}

module.exports = Logout;