const FrusterRequest = require("fruster-bus").FrusterRequest;
const errors = require("../deprecatedErrors");
const newErrors = require("../errors");
const { jwtAdditionalPayloadSize } = require("../../conf");
const TokenLoginHandler = require('./login/TokenLoginHandler');
const CookieLoginHandler = require('./login/CookieLoginHandler');
const UserManager = require("../managers/UserManager");
const config = require("../../conf");


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
	async handle({ reqId, data }, isCookie) {
		const { additionalPayload, ...userQuery } = data;

		if (additionalPayload) {
			if (Buffer.byteLength(JSON.stringify(additionalPayload)) > jwtAdditionalPayloadSize)
				throw newErrors.badRequest(`Additional payload should less than ${jwtAdditionalPayloadSize}`);

			if (additionalPayload.exp)
				throw newErrors.badRequest("Additional payload should should not include exp property");

			if (additionalPayload.salt)
				throw newErrors.badRequest("Additional payload should should not include salt property");
		}

		const userResp = await UserManager.getUsers(reqId, userQuery);

		if (!userResp.length)
			throw errors.userNotFound(`Cannot create JWT token - user not found ${JSON.stringify(userQuery)}`);
		else if (userResp.length > 1)
			throw errors.unexpectedError(`Cannot create JWT token - user not found ${JSON.stringify(userQuery)}`);
		else if (config.deactivatedUsersCanLogin === false && !!userResp[0].deactivated)
			throw errors.userDeactivated(`Cannot create JWT token - user is deactivated ${JSON.stringify(userQuery)}`);

		if (isCookie)
			return this._cookieLoginHandler.login({ userToLogin: userResp[0], additionalPayload });
		else
			return this._tokenLoginHandler.login({ userToLogin: userResp[0], additionalPayload });
	}
}

module.exports = GenerateJWTTokenHandler;
