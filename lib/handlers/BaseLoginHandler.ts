const log = require("fruster-log");
const UserServiceClient = require("../clients/UserServiceClient");


class BaseLoginHandler {

	/**
	 * @param {FrusterRequest} req
	 */
	async handle(req: any) { // TODO: Fruster bus needs to expose type defs
		const credentials = req.data;

		try {
			const validatedUserResp = await UserServiceClient.validatePassword(req.reqId, credentials);
			const userResponse = await UserServiceClient.getUser(req.reqId, validatedUserResp.data.id);

			return await this.login(userResponse, req.reqId);
		} catch (err) {
			this._handleAuthError(err);
		}
	}

	/**
	 * @param {Object} userToLogin
	 * @param {String} reqId
	 */
	login(userToLogin: any, reqId: string) {
		// Override me
	}

	/**
	 * @param {Object} err
	 */
	_handleAuthError(err: Error) {
		log.debug("User service failed validating username/password", err);
		throw err;
	}
}

export default BaseLoginHandler;
