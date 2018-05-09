const utils = require("../utils/utils");
const ms = require("ms");
const jwt = require("../utils/jwt");
const conf = require("../../conf");
const errors = require("../errors");
const BaseLoginHandler = require("./BaseLoginHandler");
const RefreshTokenRepo = require("../repos/RefreshTokenRepo");
const log = require("fruster-log");


class TokenLoginHandler extends BaseLoginHandler {

	/**
	 * @param {RefreshTokenRepo} refreshTokenRepo 
	 */
	constructor(refreshTokenRepo) {
		super();
		this.refreshTokenRepo = refreshTokenRepo;
		this.accessTokenTTL = ms(conf.accessTokenTTL);
		this.refreshTokenTTL = ms(conf.refreshTokenTTL);
	}

	/**
	 * @param {Object} userToLogin 
	 * @param {String} reqId 
	 */
	async login(userToLogin, reqId) {
		const whitelistedUser = utils.getWhitelistedUser(userToLogin);

		const authData = {
			accessToken: jwt.encode(whitelistedUser, this.accessTokenTTL),
			profile: whitelistedUser
		};

		try {
			const refreshToken = await this.refreshTokenRepo.create(whitelistedUser.id, this.refreshTokenTTL);
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