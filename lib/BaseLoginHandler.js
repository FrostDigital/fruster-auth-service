const log = require("fruster-log");
const utils = require("./utils/utils");
const constants = require("../constants");
const bus = require("fruster-bus");
const errors = require("../errors");


class BaseLoginHandler {

	handle(req) {
		const credentials = req.data;

		return bus
			.request(constants.consuming.validatePassword, {
				reqId: req.reqId,
				data: credentials
			})
			.then(validatedUserResp => this.login(validatedUserResp.data, req.reqId))			
			.catch(this._handleAuthError);
	}

	login(userToLogin, reqId) {
		// Override me
	}

	_handleAuthError(err) {
		log.debug("User service failed validating username/password", err.status);

		if (err.status !== 401 && err.status !== 403) {
			log.warn("Recieved unexpected error from user service", err);
			throw errors.unexpectedError(err.detail);
		}

		throw err;
	}
}

 module.exports = BaseLoginHandler;