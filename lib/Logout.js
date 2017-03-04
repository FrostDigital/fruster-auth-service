const constants = require("../constants");

class Logout {

	handle(req) {		
		return {
			status: 200,
			reqId: req.id,
			headers: {
				"Set-Cookie": `${constants.jwtCookieName}=delete; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
			},
			data: {}
		};
	}	
}

module.exports = Logout;