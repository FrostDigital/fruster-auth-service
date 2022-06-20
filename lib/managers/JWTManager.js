const jwt = require("jwt-simple");
const conf = require("../../conf");
const ms = require("ms");
const SessionRepo = require("../repos/SessionRepo");
const crypto = require("crypto");
const secureRandom = require("csprng");
const log = require("fruster-log");

class JWTManager {

	/**
	 * @param {SessionRepo} sessionRepo
	 */
	constructor(sessionRepo) {
		this._sessionRepo = sessionRepo;
	}

	/**
	 * @typedef {Object} SessionDetails
	 * @property {String} version app version if it exists
	 * @property {Object} userAgent
	*/

	/**
	 * Encodes a jwt token and saves a session in the database.
	 *
	 * @param {*} param0
	 * @param {Object} param0.user
	 * @param {Number} param0.expiresInMs
	 * @param {SessionDetails=} sessionDetails
	 * @param {Object=} additionalPayload
	 * @returns
	 */
	async encode({ user, expiresInMs, sessionDetails, additionalPayload = {} }) {
		try {
			const expireDate = this._calculateExpiration(expiresInMs);
			const salt = this._generateSalt();

			log.debug("expireDate - " + expireDate);

			await this._sessionRepo.add(
				this._hashExpireDate(expireDate, user.id, salt),
				user.id,
				expiresInMs,
				sessionDetails
			);

			log.debug("session added");

			return jwt.encode({ exp: expireDate, salt, ...user, ...additionalPayload }, conf.secret);
		} catch (err) {
			log.error(err);
			throw err;
		}
	}

	/**
	 * Decodes a jwt token, checking it against the session database.
	 *
	 * @param {String} token
	 */
	async decode(token) {
		try {
			const decodedToken = jwt.decode(token, conf.secret);
			const hashedExpireDate = this._hashExpireDate(decodedToken.exp, decodedToken.id, decodedToken.salt);
			const sessionFromDatabase = await this._sessionRepo.getByExpireDate(hashedExpireDate, decodedToken.id);

			if (!sessionFromDatabase && !this._isJwtTokenBeforeUpdate(decodedToken))
				throw "token not found";

			return decodedToken;
		} catch (err) {
			log.debug("Failed to decode token: " + err.message);
			throw err;
		}
	}

	/**
	 * Checks whether a jwt token was created before the "session" update or not.
	 * If true we will allow access even if the jwt token is not present in the database.
	 *
	 * @param {Object} decodedToken
	 */
	_isJwtTokenBeforeUpdate(decodedToken) {
		const lastExpireDateForOldJWTToken = (new Date("2018-05-14T15:26:34.520Z").getTime() + ms(conf.accessTokenTTL)) / 1000;

		if (decodedToken.exp <= lastExpireDateForOldJWTToken)
			return true;
		else
			return false;
	}

	/**
	 * Removes one session for a user.
	 *
	 * @param {Number} expireDate
	 * @param {String} userId
	 */
	async removeOneForUser(expireDate, userId, salt) {
		try {
			const hashedExpireDate = this._hashExpireDate(expireDate, userId, salt);
			await this._sessionRepo.removeOneByUserId(hashedExpireDate, userId);
		} catch (err) {
			log.error(err);
			throw err;
		}
	}

	/**
	 * Removes one session for a user by providing its id.
	 *
	 * @param {String} id
	 * @param {String} userId
	 */
	async removeOneForUserById(id, userId) {
		try {
			await this._sessionRepo.removeOneByUserId(id, userId);
		} catch (err) {
			log.error(err);
			throw err;
		}
	}

	/**
	 * Removes all sessions for a user.
	 *
	 * @param {String} userId
	 */
	async removeAllForUser(userId) {
		try {
			await this._sessionRepo.removeAllByQuery({ userId });
		} catch (err) {
			log.error(err);
			throw err;
		}
	}

	/**
	 * Removes all sessions for a user.
	 *
	 * @param {Array<String>} userIds
	 */
	async removeAllForUsers(userIds) {
		try {
			await this._sessionRepo.removeAllByQuery({ userId: { $in: userIds } });
		} catch (err) {
			log.error(err);
			throw err;
		}
	}

	/**
	 * Calculates expire date for jwt token.
	 *
	 * @param {Number} expiresInMs
	 */
	_calculateExpiration(expiresInMs) {
		// Exp is seconds since epoch
		return (Date.now() + expiresInMs) / 1000;
	}

	/**
	 * Hashes expire date for use in session database.
	 *
	 * @param {Number} expireDate
	 * @param {String} userId
	 */
	_hashExpireDate(expireDate, userId, salt) {
		/** Makes sure you can login if you have a token generated before salt was introduced. If such session exists that is. */
		return crypto.createHmac("sha512", `${expireDate} ${userId}${salt ? salt : ""}`).digest("hex");
	}

	/**
	 * Generates a salt (Unique key for each session) to be used with hashing.
	 *
	 * @return {String}
	 */
	_generateSalt() {
		return secureRandom(256, 36);
	}

	/**
	 * @param {String} jwt
	 * @param {Number} expiresInMs
	 */
	bakeCookie(jwt, expiresInMs) {
		const date = new Date();

		date.setTime(date.getTime() + expiresInMs);

		return `${conf.jwtCookieName}=${jwt};path=/;expires=${date.toUTCString()};${conf.jwtCookieHttpOnly ? "HttpOnly;" : ""}${conf.jwtCookieDomain ? "domain=" + conf.jwtCookieDomain + ";" : ""}`;
	}

	async updateSessionActivity(decodedToken, sessionDetails, prolongExpiryMs) {
		const { exp, id: userId, salt } = decodedToken;
		const hashedExpireDate = this._hashExpireDate(exp, userId, salt);

		await this._sessionRepo.updateSessionActivity(userId, hashedExpireDate, sessionDetails, prolongExpiryMs);
	}

}

module.exports = JWTManager;
