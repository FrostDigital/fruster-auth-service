const constants = require("../../lib/constants");
const uuid = require("uuid");
const Db = require("mongodb").Db;


class RefreshTokenRepo {

	/**
	 * @param {Db} db 
	 */
	constructor(db) {
		this._collection = db.collection(constants.collection.REFRESH_TOKENS);
		this._collection.createIndex({ token: 1 }, { unique: true });
	}

	/**
	 * @param {String} userId 
	 * @param {Number} ttlMs 
	 */
	async create(userId, ttlMs) {
		const res = await this._collection.insert({
			id: uuid.v4(),
			token: uuid.v4(),
			userId: userId,
			expired: false,
			expires: new Date(Date.now() + ttlMs)
		});

		const createdRefreshToken = res.ops[0];

		delete createdRefreshToken._id;

		return createdRefreshToken;
	}

	/**
	 * @param {String} token 
	 * @param {Boolean} allowExpired 
	 */
	get(token, allowExpired) {
		const query = {
			token: token
		};

		if (!allowExpired)
			query.expired = false;

		return this._collection.findOne(query, { fields: { _id: 0 } });
	}

	/**
	 * @param {String} token
	 */
	async expire(token) {
		const res = await this._collection.findOneAndUpdate(
			{ token: token },
			{ $set: { expired: true } },
			{
				projection: { _id: 0 },
				returnOriginal: false
			});

		if (res.value)
			return res.value;

		throw "Token does not exist";
	}
}

module.exports = RefreshTokenRepo;