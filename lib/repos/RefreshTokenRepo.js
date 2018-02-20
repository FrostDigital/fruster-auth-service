const constants = require("../../lib/constants");
const uuid = require("uuid");
const Db = require("mongodb").Db;


class RefreshTokenRepo {

	/**
	 * @param {Db} db 
	 */
	constructor(db) {
		this.collection = db.collection(constants.collection.refreshTokens);
		this.collection.createIndex({ token: 1 }, { unique: true });
	}

	/**
	 * @param {String} userId 
	 * @param {Number} ttlMs 
	 */
	create(userId, ttlMs) {
		return this.collection.insert({
			id: uuid.v4(),
			token: uuid.v4(),
			userId: userId,
			expired: false,
			expires: new Date(Date.now() + ttlMs)
		})
			.then(res => {
				let createdRefreshToken = res.ops[0];
				delete createdRefreshToken._id;
				return createdRefreshToken;
			});
	}

	/**
	 * @param {String} token 
	 * @param {Boolean} allowExpired 
	 */
	get(token, allowExpired) {
		let query = {
			token: token
		};

		if (!allowExpired)
			query.expired = false;

		return this.collection.findOne(query, { fields: { _id: 0 } });
	}

	/**
	 * @param {String} token
	 */
	expire(token) {
		return this.collection.findOneAndUpdate(
			{ token: token },
			{ $set: { expired: true } },
			{
				projection: { _id: 0 },
				returnOriginal: false
			})
			.then(res => {
				if (res.value)
					return res.value;

				throw "Token does not exist";
			});
	}
}

module.exports = RefreshTokenRepo;