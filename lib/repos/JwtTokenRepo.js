const Db = require("mongodb").Db;
const constants = require("../constants");


class JwtTokenRepo {

    /**
     * @param {Db} db 
     */
    constructor(db) {
        this.collection = db.collection(constants.collection.JWT_TOKENS);
    }

    // TODO: Save token to be included in JWT token, check database after decode.

}

module.exports = JwtTokenRepo;