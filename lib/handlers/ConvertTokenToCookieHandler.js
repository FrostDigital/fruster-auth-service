const FrusterRequest = require("fruster-bus").FrusterRequest;
const JWTManager = require("../managers/JWTManager");
const conf = require("../../conf");
const ms = require("ms");
const errors = require("../errors");


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
		if (!req.headers || !req.headers.authorization)
			throw errors.badRequest("no authorization token provided");

		const jwtToken = req.headers.authorization.replace("Bearer ", "");
		const headers = { "Set-Cookie": this._jwtManager.bakeCookie(jwtToken, this._jwtCookieAge) };

		let data;

		if (req.query && req.query.redirect) {
			headers["Content-Type"] = "text/html";
			data = `<script>window.location = "${req.query.redirect}";</script>`
		}

		return {
			status: 200,
			headers,
			data
		};
	}

}

module.exports = ConvertTokenToCookieHandler;
