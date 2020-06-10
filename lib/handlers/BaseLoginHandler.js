const log = require("fruster-log");
const bus = require("fruster-bus");
const FrusterRequest = bus.FrusterRequest;
const UserServiceClient = require("../clients/UserServiceClient");


class BaseLoginHandler {

	/**
	 * @param {FrusterRequest} req
	 */
	async handle(req) {
		const credentials = req.data;

		try {
			const validatedUserResp = await UserServiceClient.validatePassword(req.reqId, credentials);
			const userResponse = await UserServiceClient.getUser(req.reqId, validatedUserResp.data.id);

			return await this.login(userResponse, req.reqId, this._getSessionDetailsFromHeaders(req.headers));
		} catch (err) {
			this._handleAuthError(err);
		}
	}

	_getSessionDetailsFromHeaders(headers) {
		if (!headers)
			return { userAgent: {}, version: undefined };

		return { userAgent: headers["user-agent"], version: headers.version };
	}

	/**
	 * @param {Object} userToLogin
	 * @param {String} reqId
	 */
	login(userToLogin, reqId, sessionDetails) {
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
