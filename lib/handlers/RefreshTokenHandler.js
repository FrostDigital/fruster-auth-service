const utils = require("../utils/utils");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const conf = require("../../conf");
const errors = require("../deprecatedErrors");
const RefreshTokenRepo = require('../repos/RefreshTokenRepo');
const UserManager = require("../managers/UserManager");
const JWTManager = require("../managers/JWTManager");
const ms = require("ms");
const log = require("fruster-log");

class RefreshTokenHandler {

	/**
	 * @param {RefreshTokenRepo} refreshTokenRepo
	 * @param {JWTManager} jwtManager
	 */
	constructor(refreshTokenRepo, jwtManager) {
		this._repo = refreshTokenRepo;
		this._jwtManager = jwtManager;
		this._refreshTokenTTL = ms(conf.refreshTokenTTL);
		this._accessTokenTTL = ms(conf.accessTokenTTL);
	}

	/**
	 * @param {FrusterRequest} req
	 */
	async handleHttp({ reqId, data: { refreshToken } }) {
		if (!refreshToken)
			return errors.missingRefreshToken();

		const refreshTokenFromDatabase = await this._repo.get(refreshToken, true);
		this._validateRefreshToken(refreshTokenFromDatabase);

		const userId = refreshTokenFromDatabase.userId;
		const accessToken = await this._createNewAccessToken(userId, reqId);

		log.debug("access token created from refresh token");

		return {
			status: 200,
			data: { accessToken }
		};
	}

	/**
	 * @param {Object} token
	 */
	_validateRefreshToken(token) {
		if (!token)
			throw errors.refreshTokenNotFound();
		else if (token.expired || token.expires.getTime() < new Date().getTime())
			throw errors.refreshTokenExpired(token);
	}

	/**
	 * @param {String} userId
	 * @param {String} reqId
	 */
	async _createNewAccessToken(userId, reqId) { // TODO:
		const userResp = await UserManager.getUser(reqId, userId);

		if (!userResp)
			throw errors.userNotFound(userId);

		return await this._jwtManager.encode(utils.getWhitelistedUser(userResp), this._accessTokenTTL);
	}

}

module.exports = RefreshTokenHandler;
