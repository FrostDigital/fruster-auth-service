const jwt = require("jwt-simple");
const conf = require("../../conf");
const ms = require("ms");


class JWT {

    /**
     * @param {Object} user 
     * @param {Number=} expiresInMs 
     */
    static encode(user, expiresInMs) {
        const o = Object.assign({
            exp: this._calcExpiration(expiresInMs)
        }, user);

        return jwt.encode(o, conf.secret);
    }

    /**
     * @param {String} token 
     */
    static decode(token) {
        return jwt.decode(token, conf.secret);
    }

    /**
     * @param {Number} expiresInMs 
     */
    static _calcExpiration(expiresInMs) {
        // Exp is seconds since epoch 
        return (Date.now() + expiresInMs) / 1000;
    }

}

module.exports = JWT;