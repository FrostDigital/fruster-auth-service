const Db = require("mongodb").Db;
const constants = require("../constants");
const RANDOM_TIMEOUT = 25200000;

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
     * @param {Number} expiresInMs
     */
	async add(id, userId, expiresInMs, sessionDetails) {
		return await this._collection.insert({
			id,
			userId,
			sessionDetails: { ...sessionDetails, created: new Date() },
			expires: new Date(Date.now() + expiresInMs + (Math.random() * RANDOM_TIMEOUT))
		});
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
	 * Removes by query
	 *
	 * @param {Object} query
	 */
	async removeAllByQuery(query) {
		return await this._collection.remove(query);
	}

	/**
	 * @param {Object} param0
	 * @param {Object} param0.query
	 * @param {Object=} param0.sort
	 * @param {Number=} param0.page
	 * @param {Number=} param0.pageSize
	*/
	async find({ query, sort, page = 0, pageSize = 1000 }) {
		const dbQuery = this._collection.find(query)
			.sort(sort)
			.limit(pageSize)
			.skip(page * pageSize);

		const sessions = await dbQuery
			.toArray();

		const totalCount = await dbQuery
			.count();

		return { sessions, totalCount }
	}

	async updateSessionActivity(userId, hashedExpireDate) {
		return await this._collection.updateOne({ userId, hashedExpireDate }, { $set: { $set: { sessionDetails: { lastActivity: new Date() } } } });
	}

}

module.exports = SessionRepo;
