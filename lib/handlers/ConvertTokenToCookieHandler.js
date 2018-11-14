const FrusterRequest = require("fruster-bus").FrusterRequest;
const JWTManager = require("../managers/JWTManager");
const conf = require("../../conf");
const ms = require("ms");

class ConvertTokenToCookieHandler {

	/**
	 * @param {JWTManager} jwtManager
	 */
	constructor(jwtManager) {
		this._jwtManager = jwtManager;
		this._jwtCookieAge = ms(conf.jwtCookieAge);
	}

	/**
	 * @param {FrusterRequest} req
	 */
	async handleHttp(req) {
		// @ts-ignore
		const jwtToken = req.headers.authorization.replace("Bearer ", "");

		return {
			status: 200,
			data: req.user,
			headers: {
				"Set-Cookie": this._jwtManager.bakeCookie(jwtToken, this._jwtCookieAge)
			}
		};
	}

}

module.exports = ConvertTokenToCookieHandler;
