const utils = require("./utils/utils");
const ms = require("ms");
const jwt = require("./utils/jwt");
const conf = require("../conf");
const errors = require("../errors");
const BaseLoginHandler = require("./BaseLoginHandler");
const RefreshTokenRepo = require("./repos/RefreshTokenRepo");


class TokenLogin extends BaseLoginHandler {

	/**
	 * 
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
	login(userToLogin, reqId) {
		const whitelistedUser = utils.getWhitelistedUser(userToLogin);

		const authData = {
			accessToken: jwt.encode(whitelistedUser, this.accessTokenTTL),
			profile: whitelistedUser
		};

		return this.refreshTokenRepo.create(whitelistedUser.id, this.refreshTokenTTL)
			.then((refreshToken) => {
				authData.refreshToken = refreshToken.token;

				return {
					reqId: reqId,
					status: 200,
					data: authData
				};
			})
			.catch((err) => {
				console.log(err);
				throw errors.unexpectedError("Failed saving refresh token");
			});
	}

}

module.exports = TokenLogin;