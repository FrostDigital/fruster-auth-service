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
		this._jwtCookieAge =  ms(conf.cookieSessionTTL || conf.jwtCookieAge);
	}

	/**
	 * @param {FrusterRequest} req
	 */
	async handleHttp({ headers: { authorization }, query }) {
		const tokenFromQuery = query && query.token;

		if (!authorization && !tokenFromQuery)
			throw errors.badRequest("no authorization header or token in query string was provided");

		const jwtToken = tokenFromQuery ? tokenFromQuery : authorization.replace("Bearer ", "");
		const headers = { "Set-Cookie": this._jwtManager.bakeCookie(jwtToken, this._jwtCookieAge) };

		let data;

		if (query && query.redirect) {
			headers["Content-Type"] = "text/html";
			data = `<script>window.location = "${query.redirect}";</script>`
		}

		return {
			status: 200,
			headers,
			data
		};
	}

}

module.exports = ConvertTokenToCookieHandler;
