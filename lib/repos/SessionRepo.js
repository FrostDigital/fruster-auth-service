const Db = require("mongodb").Db;
const constants = require("../constants");


class SessionRepo {

    /**
     * @param {Db} db 
     */
    constructor(db) {
        this._collection = db.collection(constants.collection.SESSIONS);
    }

    /**
     * Adds
     * 
     * @param {String} id 
     * @param {String} userId 
     */
    async add(id, userId) {
        return await this._collection.insert({ id, userId });
    }

    /**
     * Gets by expireDate number and userId.
     * 
     * @param {String} id 
     * @param {String} userId 
     */
    async getByExpireDate(id, userId) {
        return await this._collection.findOne({ id, userId })
    }

    /**
     * Removes on by expireDate and userId.
     * 
     * @param {String} id 
     * @param {String} userId 
     */
    async removeOne(id, userId) {
        return await this._collection.remove({ id, userId });
    }

    /**
     * Removes all for a user.
     * 
     * @param {String} userId 
     */
    async removeAll(userId) {
        return await this._collection.remove({ userId });
    }

}

module.exports = SessionRepo;