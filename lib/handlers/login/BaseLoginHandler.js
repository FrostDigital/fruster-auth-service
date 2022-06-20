const log = require("fruster-log");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const UserManager = require("../../managers/UserManager");
const UserServiceClient = require("../../clients/UserServiceClient");
const Utils = require("../../utils/utils");
const errors = require("../../deprecatedErrors");
const config = require("../../../conf");

class BaseLoginHandler {

	/**
	 * @param {FrusterRequest} req
	 */
	async handleHttp({ reqId, data: { username, password, ...additionalQuery }, headers }) {
		try {
			const passwordValidateQuery = {
				reqId,
				username,
				password
			};

			if (Object.keys(additionalQuery).length)
				passwordValidateQuery.additionalQuery = additionalQuery;

			const { id } = await UserServiceClient.validatePassword(passwordValidateQuery);
			const userToLogin = await UserManager.getUser(reqId, id);

			if (config.deactivatedUsersCanLogin === false && !!userToLogin.deactivated)
				throw errors.userDeactivated();

			const sessionDetails = Utils.getSessionDetailsFromHeaders(headers); (headers);

			return await this.login({ userToLogin, sessionDetails });
		} catch (err) {
			this._handleAuthError(err);
		}
	}

	/**
	 * @typedef {Object} SessionDetails
	 * @property {String} version app version if it exists
	 * @property {Object} userAgent
	 */

	/**
	 * @override
	 * @param {*} param0
	 * @param {Object} param0.userToLogin
	 * @param {SessionDetails=} param0.sessionDetails
	 * @param {Object=} param0.additionalPayload
	 * @returns
	 */
	login({ userToLogin, sessionDetails, additionalPayload }) {
		// Override me
	}

	/**
	 * @param {Object} err
	 */
	_handleAuthError(err) {
		log.debug("User service failed validating username/password", err);
		throw err;
	}

}

module.exports = BaseLoginHandler;
