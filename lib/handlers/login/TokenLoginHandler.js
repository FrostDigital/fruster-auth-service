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
	 * @typedef {Object} SessionDetails
	 * @property {String} version app version if it exists
	 * @property {Object} userAgent
	 */

	/**
	 * @override
	 * @param {*} param0
	 * @param {Object} param0.userToLogin
	 * @param {SessionDetails=} param0.sessionDetails
	 * @param {Object=} param0.additionalPayload
	 * @returns
	 */
	async login({ userToLogin, sessionDetails, additionalPayload }) {
		const whitelistedUser = utils.getWhitelistedUser(userToLogin);

		const accessToken = await this._jwtManager.encode({
			user: { id: userToLogin.id },
			expiresInMs: this._accessTokenTTL,
			sessionDetails,
			additionalPayload
		});

		const authData = {
			accessToken,
			[conf.userDataResponseKey]: whitelistedUser
		};

		try {
			const { token } = await this._refreshTokenRepo.create(whitelistedUser.id, this._refreshTokenTTL);
			authData.refreshToken = token;

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
