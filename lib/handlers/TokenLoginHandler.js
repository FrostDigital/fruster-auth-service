const utils = require("../utils/utils");
const ms = require("ms");
const conf = require("../../conf");
const errors = require("../errors");
const BaseLoginHandler = require("./BaseLoginHandler");
const RefreshTokenRepo = require("../repos/RefreshTokenRepo");
const log = require("fruster-log");
const JWTManager = require("../managers/JWTManager");


class TokenLoginHandler extends BaseLoginHandler {

	/**
	 * @param {RefreshTokenRepo} refreshTokenRepo 
	 * @param {JWTManager} jwtManager 
	 */
	constructor(refreshTokenRepo, jwtManager) {
		super();
		this._refreshTokenRepo = refreshTokenRepo;
		this._jwtManager = jwtManager;
		this._accessTokenTTL = ms(conf.accessTokenTTL);
		this._refreshTokenTTL = ms(conf.refreshTokenTTL);
	}

	/**
	 * @param {Object} userToLogin 
	 * @param {String} reqId 
	 */
	async login(userToLogin, reqId) {
		const whitelistedUser = utils.getWhitelistedUser(userToLogin);

		const authData = {
			accessToken: await this._jwtManager.encode(whitelistedUser, this._accessTokenTTL),
			profile: whitelistedUser
		};

		try {
			const refreshToken = await this._refreshTokenRepo.create(whitelistedUser.id, this._refreshTokenTTL);
			authData.refreshToken = refreshToken.token;

			return {
				status: 200,
				data: authData
			};
		} catch (err) {
			log.error(err);
			throw errors.unexpectedError("Failed saving refresh token");
		}
	}

}

module.exports = TokenLoginHandler;