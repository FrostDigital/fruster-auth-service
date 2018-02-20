const utils = require("../utils/utils");
const bus = require("fruster-bus");
const jwt = require("../utils/jwt");
const conf = require("../../conf");
const errors = require("../errors");
const FrusterRequest = bus.FrusterRequest;
const RefreshTokenRepo = require('../repos/RefreshTokenRepo');


class RefreshTokenHandler {

	/**
	 * @param {RefreshTokenRepo} refreshTokenRepo 
	 */
	constructor(refreshTokenRepo) {
		this._repo = refreshTokenRepo;
	}

	/**
	 * @param {FrusterRequest} req 
	 */
	async handle(req) {
		let refreshToken = req.data.refreshToken;

		if (!refreshToken)
			return errors.missingRefreshToken();

		const refreshTokenFromDatabase = await this._repo.get(refreshToken, true);
		const userId = this._validateRefreshToken(refreshTokenFromDatabase);

		const accessToken = await this._createNewAccessToken(userId, req.reqId);

		return {
			status: 200,
			data: { accessToken: accessToken }
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
		const userResp = await bus.request({
			subject: conf.userServiceGetUserSubject,
			skipOptionsRequest: true,
			message: {
				reqId: reqId,
				data: { id: userId }
			}
		});

		return await jwt.encode(utils.getWhitelistedUser(userResp.data));
	}
}

module.exports = RefreshTokenHandler;