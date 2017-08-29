const log = require("fruster-log");
const utils = require("./utils/utils");
const constants = require("../constants");
const bus = require("fruster-bus");
const errors = require("../errors");
const conf = require("../conf");

const jasmineRunner = require('../spec/support/jasmine-runner');


class BaseLoginHandler {

	async handle(req) {
		const credentials = req.data;

		try {
			const validatedUserResp = await bus.request(constants.consuming.validatePassword, {
				reqId: req.reqId,
				data: credentials
			});

			const userResponse = await bus.request(conf.userServiceGetUserSubject, {
				reqId: req.reqId,
				data: { id: validatedUserResp.id }
			});

			return await this.login(userResponse.data, req.reqId);

		} catch (err) {
			this._handleAuthError(err);
		}
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