const bus = require("fruster-bus");
const conf = require("../../conf");
const errors = require("../errors");
const FrusterRequest = bus.FrusterRequest;
const TokenLoginHandler = require('./TokenLoginHandler');
const CookieLoginHandler = require('./CookieLoginHandler');


class GenerateJWTTokenHandler {

	/**
	 * @param {TokenLoginHandler} tokenLogin 
	 * @param {CookieLoginHandler} cookieLogin 
	 */
	constructor(tokenLogin, cookieLogin) {
		this._tokenLoginHandler = tokenLogin;
		this._cookieLoginHandler = cookieLogin;
	}

	/**
	 * @param {FrusterRequest} req 
	 * @param {Boolean} isCookie 
	 */
	handle(req, isCookie) {
		const userQuery = req.data;

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
					return this._cookieLoginHandler.login(user, req.reqId);
				} else {
					return this._tokenLoginHandler.login(user, req.reqId);
				}
			});
	}
}

module.exports = GenerateJWTTokenHandler;