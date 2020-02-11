const FrusterRequest = require("fruster-bus").FrusterRequest;
const errors = require("../deprecatedErrors");
const TokenLoginHandler = require('./login/TokenLoginHandler');
const CookieLoginHandler = require('./login/CookieLoginHandler');
const UserManager = require("../managers/UserManager");


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
	async handle({ reqId, data: userQuery }, isCookie) {
		const userResp = await UserManager.getUsers(reqId, userQuery);

		if (!userResp.length)
			throw errors.userNotFound(`Cannot create JWT token - user not found ${JSON.stringify(userQuery)}`);
		else if (userResp.length > 1)
			throw errors.unexpectedError(`Cannot create JWT token - user not found ${JSON.stringify(userQuery)}`);

		if (isCookie)
			return this._cookieLoginHandler.login(userResp[0]);
		else
			return this._tokenLoginHandler.login(userResp[0]);
	}
}

module.exports = GenerateJWTTokenHandler;
