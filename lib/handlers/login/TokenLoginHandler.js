const ms = require("ms");
const log = require("fruster-log");
const utils = require("../../utils/utils");
const conf = require("../../../conf");
const errors = require("../../deprecatedErrors");
const BaseLoginHandler = require("../login/BaseLoginHandler");
const RefreshTokenRepo = require("../../repos/RefreshTokenRepo");
const JWTManager = require("../../managers/JWTManager");


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
	 * @override
	 *
	 * @param {Object} userToLogin
	 */
	async login(userToLogin, sessionDetails) {
		const whitelistedUser = utils.getWhitelistedUser(userToLogin);

		const authData = {
			accessToken: await this._jwtManager.encode({ id: userToLogin.id }, this._accessTokenTTL, sessionDetails),
			[conf.userDataResponseKey]: whitelistedUser
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
