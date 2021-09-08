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
	async login({ userToLogin, sessionDetails, encodableData }) {
		log.debug("Successfully authenticated user", userToLogin.id);

		const whitelistedUser = utils.getWhitelistedUser(userToLogin);

		const encodeData = { id: userToLogin.id };

		if (encodableData)
			encodeData = { ...encodeData, ...encodableData };

		const jwtToken = await this._jwtManager.encode(encodeData, this._jwtCookieAge, sessionDetails);

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
