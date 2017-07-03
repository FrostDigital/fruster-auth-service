const constants = require("../constants");
const conf = require("../conf");

class Logout {

	handle(req) {		
		return {
			status: 200,
			reqId: req.id,
			headers: {
				"Set-Cookie": `${constants.jwtCookieName}=delete; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${conf.jwtCookieHttpOnly ? "HttpOnly;" : ""}${conf.jwtCookieDomain ? "domain=" + conf.jwtCookieDomain + ";": ""}`
			},
			data: {}
		};
	}	
}

module.exports = Logout;