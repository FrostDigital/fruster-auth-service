const log = require("fruster-log");
const bus = require("fruster-bus");
const FrusterRequest = bus.FrusterRequest;
const UserServiceClient = require("../../clients/UserServiceClient");


class BaseLoginHandler {

	constructor() { }

	/**
	 * @param {FrusterRequest} req
	 */
	async handle(req) {
		const credentials = req.data;

		try {
			const validatedUserResp = await UserServiceClient.validatePassword(req.reqId, credentials);
			const userResponse = await UserServiceClient.getUser(req.reqId, validatedUserResp.data.id);

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
