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
		let status = 200;

		const jwtToken = req.headers.authorization.replace("Bearer ", "");
		const headers = { "Set-Cookie": this._jwtManager.bakeCookie(jwtToken, this._jwtCookieAge) };

		if (req.query && req.query.redirect) {
			headers.Location = req.query.redirect;
			status = 303;
		}

		return {
			status,
			data: req.user,
			headers
		};
	}

}

module.exports = ConvertTokenToCookieHandler;
