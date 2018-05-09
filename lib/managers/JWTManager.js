const jwt = require("jwt-simple");
const conf = require("../../conf");
const ms = require("ms");
const utils = require("../utils/utils");
const JWTTokenRepo = require("../repos/JWTTokenRepo");
const crypto = require("crypto");
const secureRandom = require("csprng");
const log = require("fruster-log");


class JWTManager {

    /**
     * @param {JWTTokenRepo} jwtTokenRepo 
     */
    constructor(jwtTokenRepo) {
        this._jwtTokenRepo = jwtTokenRepo;
    }

    /**
     * @param {Object} user 
     * @param {Number} expiresInMs 
     */
    async encode(user, expiresInMs) {
        try {
            const expireDate = this._calculateExpiration(expiresInMs);
            const o = Object.assign({
                exp: expireDate
            }, user);

            await this._jwtTokenRepo.add(this._hashExpireDate(expireDate, user.id), user.id);

            return jwt.encode(o, conf.secret);
        } catch (err) {
            log.error(err);
            throw err;
        }
    }

    /**
     * @param {String} token 
     */
    async decode(token) {
        try {
            const decodedToken = jwt.decode(token, conf.secret);
            const hashedExpireDate = this._hashExpireDate(decodedToken.exp, decodedToken.id);
            const tokenFromDatabase = await this._jwtTokenRepo.getByExpireDate(hashedExpireDate, decodedToken.id);

            if (!tokenFromDatabase)
                throw "token not found";

            return decodedToken;
        } catch (err) {
            log.error(err);
            throw err;
        }
    }

    /**
     * @param {Number} expireDate 
     * @param {String} userId 
     */
    async removeOneForUser(expireDate, userId) {
        try {
            const hashedExpireDate = this._hashExpireDate(expireDate, userId);
            await this._jwtTokenRepo.removeOne(hashedExpireDate, userId);
        } catch (err) {
            log.error(err);
            throw err;
        }
    }

    /**
     * @param {String} userId 
     */
    async removeAllForUser(userId) {
        try {
            await this._jwtTokenRepo.removeAll(userId);
        } catch (err) {
            log.error(err);
            throw err;
        }
    }

	/**
	 * @param {Number} expiresInMs 
	 */
    _calculateExpiration(expiresInMs) {
        // Exp is seconds since epoch 
        return (Date.now() + expiresInMs) / 1000;
    }

    /**
     * @param {Number} expireDate 
     * @param {String} userId 
     */
    _hashExpireDate(expireDate, userId) {
        return crypto.createHmac("sha512", `${expireDate} ${userId}`).digest("hex");
    }

}

module.exports = JWTManager;