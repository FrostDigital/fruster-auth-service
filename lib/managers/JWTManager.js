const jwt = require("jwt-simple");
const conf = require("../../conf");
const ms = require("ms");
const SessionRepo = require("../repos/SessionRepo");
const crypto = require("crypto");
const log = require("fruster-log");

class JWTManager {

	/**
	 * @param {SessionRepo} sessionRepo 
	 */
	constructor(sessionRepo) {
		this._sessionRepo = sessionRepo;
	}

	/**
	 * Encodes a jwt token and saves a session in the database.
	 * 
	 * @param {Object} user 
	 * @param {Number} expiresInMs 
	 */
	async encode(user, expiresInMs) {
		try {
			const expireDate = this._calculateExpiration(expiresInMs);

			log.debug("expireDate - " + expireDate);

			await this._sessionRepo.add(this._hashExpireDate(expireDate, user.id), user.id);

			log.debug("session added");

			const o = Object.assign({
				exp: expireDate
			}, user);

			return jwt.encode(o, conf.secret);
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
			const hashedExpireDate = this._hashExpireDate(decodedToken.exp, decodedToken.id);
			const sessionFromDatabase = await this._sessionRepo.getByExpireDate(hashedExpireDate, decodedToken.id);

			if (!sessionFromDatabase && !this._isJwtTokenBeforeUpdate(decodedToken))
				throw "token not found";

			return decodedToken;
		} catch (err) {
			log.error(err);
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
	async removeOneForUser(expireDate, userId) {
		try {
			const hashedExpireDate = this._hashExpireDate(expireDate, userId);
			await this._sessionRepo.removeOne(hashedExpireDate, userId);
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
			await this._sessionRepo.removeAll(userId);
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
	_hashExpireDate(expireDate, userId) {
		return crypto.createHmac("sha512", `${expireDate} ${userId}`).digest("hex");
	}

}

module.exports = JWTManager;
