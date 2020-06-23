const log = require("fruster-log");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const UserManager = require("../../managers/UserManager");
const UserServiceClient = require("../../clients/UserServiceClient");
const Utils = require("../../utils/utils");

class BaseLoginHandler {

	/**
	 * @param {FrusterRequest} req
	 */
	async handleHttp({ reqId, data: { username, password }, headers }) {
		try {
			const { id } = await UserServiceClient.validatePassword({ reqId, username, password });
			const userResponse = await UserManager.getUser(reqId, id);
			const sessionDetails = Utils.getSessionDetailsFromHeaders(headers); (headers);

			return await this.login(userResponse, sessionDetails);
		} catch (err) {
			this._handleAuthError(err);
		}
	}

	/**
	 * @param {Object} userToLogin
	 */
	login(userToLogin, sessionDetails) {
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
