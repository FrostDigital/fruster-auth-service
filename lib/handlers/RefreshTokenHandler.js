const utils = require("../utils/utils");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const conf = require("../../conf");
const errors = require("../deprecatedErrors");
const RefreshTokenRepo = require('../repos/RefreshTokenRepo');
const UserManager = require("../managers/UserManager");
const JWTManager = require("../managers/JWTManager");
const SessionRepo = require("../repos/SessionRepo");
const ms = require("ms");
const log = require("fruster-log");
const Utils = require("../utils/utils");

class RefreshTokenHandler {

	/**
	 * @param {RefreshTokenRepo} refreshTokenRepo
	 * @param {JWTManager} jwtManager
	 * @param {SessionRepo} sessionRepo
	 */
	constructor(refreshTokenRepo, jwtManager, sessionRepo) {
		this._repo = refreshTokenRepo;
		this._jwtManager = jwtManager;
		this._sessionRepo = sessionRepo;
		this._refreshTokenTTL = ms(conf.refreshTokenTTL);
		this._accessTokenTTL = ms(conf.accessTokenTTL);
	}

	/**
	 * @param {FrusterRequest} req
	 */
	async handleHttp({ reqId, headers, data: { refreshToken } }) {
		if (!refreshToken)
			return errors.missingRefreshToken();

		const refreshTokenFromDatabase = await this._repo.get(refreshToken, true);
		this._validateRefreshToken(refreshTokenFromDatabase);

		const userId = refreshTokenFromDatabase.userId;

		/** Removes the old session since a new one will be created when new access token is created*/
		if (headers.authorization) { // should never happen that the token is undefined?
			try {
				const jwtToken = headers.authorization.replace("Bearer ", "");
				const decodedToken = await this._jwtManager.decode(jwtToken);

				await this._jwtManager.removeOneForUser(decodedToken.exp, userId, decodedToken.salt);
			} catch (err) {
				log.error("was unable to decode previous token and/or remove old session:", err);
			}
		}

		const accessToken = await this._createNewAccessToken(userId, reqId, headers);

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
	async _createNewAccessToken(userId, reqId, headers) {
		const userResp = await UserManager.getUser(reqId, userId);

		if (!userResp)
			throw errors.userNotFound(userId);

		return await this._jwtManager.encode(utils.getWhitelistedUser(userResp), this._accessTokenTTL, Utils.getSessionDetailsFromHeaders(headers));
	}

}

module.exports = RefreshTokenHandler;
