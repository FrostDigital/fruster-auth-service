const bus = require("fruster-bus");
const constants = require("../../lib/constants");
const service = require("../../auth-service");

module.exports = {

	/**
	 * @param {Function=} afterStart
	 */
	testUtilsOptions: (afterStart) => {
		return {
			mockNats: true,
			bus,
			service,
			afterStart,
			mongoUrl: `mongodb://localhost:27017/${constants.SERVICE_NAME}-test`
		};
	}

};
