const bus = require("fruster-bus");
const conf = require("../../conf");
const errors = require("../errors");
const FrusterRequest = bus.FrusterRequest;
const TokenLoginHandler = require('./TokenLoginHandler');
const CookieLoginHandler = require('./CookieLoginHandler');
const UserServiceClient = require("../clients/UserServiceClient");


class GenerateJWTTokenHandler {

	/**
	 * @param {TokenLoginHandler} tokenLogin 
	 * @param {CookieLoginHandler} cookieLogin 
	 */
	constructor(tokenLogin, cookieLogin) {
		this._tokenLoginHandler = tokenLogin;
		this._cookieLoginHandler = cookieLogin;
		this._userServiceClient = new UserServiceClient();
	}

	/**
	 * @param {FrusterRequest} req 
	 * @param {Boolean} isCookie 
	 */
	async handle(req, isCookie) {
		const userQuery = req.data;
		const userResp = await this._userServiceClient.getUsers(req.reqId, userQuery);

		if (!userResp.length)
			throw errors.userNotFound(`Cannot create JWT token - user not found ${JSON.stringify(req.data)}`);
		else if (userResp.length > 1)
			throw errors.unexpectedError(`Cannot create JWT token - user not found ${JSON.stringify(req.data)}`);

		if (isCookie)
			return this._cookieLoginHandler.login(userResp[0], req.reqId);
		else
			return this._tokenLoginHandler.login(userResp[0], req.reqId);
	}
}

module.exports = GenerateJWTTokenHandler;