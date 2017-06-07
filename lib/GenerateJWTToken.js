const bus = require("fruster-bus");
const conf = require("../conf");
const errors = require("../errors");

class GenerateJWTToken {

	constructor(tokenLogin, cookieLogin) {
		this.tokenLoginHandler = tokenLogin;
		this.cookieLoginHandler = cookieLogin;
	}

	handle(req, isCookie) {
		let userQuery = req.data;

		return bus.request(conf.userServiceGetUserSubject, {
				reqId: req.reqId,
				data: userQuery
			})
			.then(userResp => {
				if (!userResp.data.length) {
					throw errors.userNotFound(`Cannot create JWT token - user not found ${JSON.stringify(req.data)}`);
				} else if (userResp.data.length > 1) {
					throw errors.unexpectedError(`Cannot create JWT token - user not found ${JSON.stringify(req.data)}`);
				}
				return userResp.data[0];
			})
			.then((user) => {
				if (isCookie) {
					return this.cookieLoginHandler.login(user, req.reqId);
				} else {
					return this.tokenLoginHandler.login(user, req.reqId);					
				}
			});
	}
}

module.exports = GenerateJWTToken;