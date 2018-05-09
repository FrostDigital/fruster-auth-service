const utils = require("../utils/utils");
const bus = require("fruster-bus");
const JWT = require("../utils/JWT");
const conf = require("../../conf");
const errors = require("../errors");
const FrusterRequest = bus.FrusterRequest;
const RefreshTokenRepo = require('../repos/RefreshTokenRepo');
const UserServiceClient = require("../clients/UserServiceClient");
const JWTManager = require("../managers/JWTManager");


class RefreshTokenHandler {

	/**
	 * @param {RefreshTokenRepo} refreshTokenRepo 
	 * @param {JWTManager} jwtManager 
	 */
	constructor(refreshTokenRepo, jwtManager) {
		this._repo = refreshTokenRepo;
		this._jwtManager = jwtManager;
		this._userServiceClient = new UserServiceClient();
	}

	/**
	 * @param {FrusterRequest} req 
	 */
	async handle(req) {
		const refreshToken = req.data.refreshToken;

		if (!refreshToken)
			return errors.missingRefreshToken();

		const refreshTokenFromDatabase = await this._repo.get(refreshToken, true);
		const userId = this._validateRefreshToken(refreshTokenFromDatabase);
		const accessToken = await this._createNewAccessToken(userId, req.reqId);

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

		return token.userId;
	}

	/**
	 * @param {String} userId 
	 * @param {String} reqId 
	 */
	async _createNewAccessToken(userId, reqId) {
		const userResp = await this._userServiceClient.getUser(reqId, userId);

		if (!userResp)
			throw errors.userNotFound(userId);

		return await JWT.encode(utils.getWhitelistedUser(userResp));
	}
}

module.exports = RefreshTokenHandler;