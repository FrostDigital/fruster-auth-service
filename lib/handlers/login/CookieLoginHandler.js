const log = require("fruster-log");
const utils = require("../../utils/utils");
const ms = require("ms");
const conf = require("../../../conf");
const BaseLoginHandler = require(".././login/BaseLoginHandler");
const JWTManager = require("../../managers/JWTManager");


class CookieLoginHandler extends BaseLoginHandler {

	/**
	 * @param {JWTManager} jwtManager
	 */
	constructor(jwtManager) {
		super();
		this._jwtManager = jwtManager;
		this._jwtCookieAge = ms(conf.jwtCookieAge);
	}

	/**
	 * @override
	 *
	 * @param {Object} userToLogin
	 */
	async login(userToLogin) {
		log.debug("Successfully authenticated user", userToLogin.id);

		const whitelistedUser = utils.getWhitelistedUser(userToLogin);
		const jwtToken = await this._jwtManager.encode({ id: userToLogin.id }, this._jwtCookieAge);

		return {
			status: 200,
			data: whitelistedUser,
			headers: {
				"Set-Cookie": this._jwtManager.bakeCookie(jwtToken, this._jwtCookieAge)
			}
		};
	}

}

module.exports = CookieLoginHandler;
