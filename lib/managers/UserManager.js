const bus = require("fruster-bus");
const UserServiceClient = require("../clients/UserServiceClient");
const conf = require('../../conf');

class UserManager {

	/**
	 * Get user by id.
	 *
	 * @param {String} reqId
	 * @param {String} userId
	 */
	static async getUser(reqId, userId) {
		const res = await UserManager.getUsers(reqId, { id: userId });

		return res ? res[0] : null;
	}

	/**
	* Gets users by query.
	*
	* @param {String} reqId
	* @param {Object} query
	*/
	static async getUsers(reqId, query) {
		/** If subject has been configured to be something else than the default config we should use legacy calling to not break old projects. */
		if (conf.userServiceGetUserSubject === UserServiceClient.endpoints.GET_USERS_BY_QUERY) {
			const { users } = await UserServiceClient.getUsersByQuery({ reqId, query, expand: "true" });

			return users;
		} else {

			const { data } = await bus.request({
				subject: conf.userServiceGetUserSubject,
				skipOptionsRequest: true,
				message: { reqId, data: query }
			});

			/** Make sure it works with the older configured (non fruster-core) endpoints where users are returned in an array*/
			return Array.isArray(data) ? data : data.users;
		}
	}

}

module.exports = UserManager;
