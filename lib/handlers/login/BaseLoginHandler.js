const log = require("fruster-log");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const UserManager = require("../../managers/UserManager");
const UserServiceClient = require("../../clients/UserServiceClient");


class BaseLoginHandler {

	/**
	 * @param {FrusterRequest} req
	 */
	async handle({ reqId, data: { username, password } }) {
		try {
			const { id } = await UserServiceClient.validatePassword({ reqId, username, password });
			const userResponse = await UserManager.getUser(reqId, id);
			return await this.login(userResponse);
		} catch (err) {
			this._handleAuthError(err);
		}
	}

	/**
	 * @param {Object} userToLogin
	 */
	login(userToLogin) {
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
