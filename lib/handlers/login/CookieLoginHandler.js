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
		log.debug("Successfully authenticated user", userToLogin.id);

		const whitelistedUser = utils.getWhitelistedUser(userToLogin);

		const jwtToken = await this._jwtManager.encode({
			user: { id: userToLogin.id },
			expiresInMs: this._jwtCookieAge,
			sessionDetails,
			additionalPayload
		});

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
