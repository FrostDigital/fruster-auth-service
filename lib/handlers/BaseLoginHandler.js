const log = require("fruster-log");
const utils = require("../utils/utils");
const constants = require("../../lib/constants");
const bus = require("fruster-bus");
const errors = require("../errors");
const conf = require("../../conf");
const FrusterRequest = bus.FrusterRequest;


class BaseLoginHandler {

	/**
	 * @param {FrusterRequest} req 
	 */
	async handle(req) {
		const credentials = req.data;

		try {
			const validatedUserResp = await bus.request(constants.consuming.VALIDATE_PASSWORD, {
				reqId: req.reqId,
				data: credentials
			});

			const userResponse = await bus.request(conf.userServiceGetUserSubject, {
				reqId: req.reqId,
				data: { id: validatedUserResp.data.id }
			});

			return await this.login(userResponse.data[0], req.reqId);

		} catch (err) {
			this._handleAuthError(err);
		}
	}

	/**
	 * @param {Object} userToLogin 
	 * @param {String} reqId 
	 */
	login(userToLogin, reqId) {
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