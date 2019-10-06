const log = require("fruster-log");
const utils = require("../utils/utils");
const ms = require("ms");
const conf = require("../../conf");
import BaseLoginHandler from "./BaseLoginHandler";
import JWTManager from "../managers/JWTManager";

class CookieLoginHandler extends BaseLoginHandler {

	private jwtManager: JWTManager;
	private jwtCookieAge: number;

	/**
	 * @param {JWTManager} jwtManager
	 */
	constructor(jwtManager: JWTManager) {
		super();
		this.jwtManager = jwtManager;
		this.jwtCookieAge = ms(conf.jwtCookieAge);
	}

	/**
	 * @param {Object} userToLogin
	 * @param {String} reqId
	 */
	async login(userToLogin: any, reqId: string) {
		log.debug("Successfully authenticated user!", userToLogin.id);

		const whitelistedUser = utils.getWhitelistedUser(userToLogin);
		const jwtToken = await this.jwtManager.encode(whitelistedUser, this.jwtCookieAge);

		return {
			status: 200,
			reqId: reqId,
			data: whitelistedUser,
			headers: {
				"Set-Cookie": this._bakeCookie(jwtToken, this.jwtCookieAge)
			}
		};
	}

	_bakeCookie(jwt: string, expiresInMs: number) {
		const date = new Date();

		date.setTime(date.getTime() + expiresInMs);

		return `${conf.jwtCookieName}=${jwt};path=/;expires=${date.toUTCString()};${conf.jwtCookieHttpOnly ? "HttpOnly;" : ""}${conf.jwtCookieDomain ? "domain=" + conf.jwtCookieDomain + ";" : ""}`;
	}

}

export default CookieLoginHandler;
