const log = require("fruster-log");
const jwt = require("./utils/jwt");
const errors = require("../errors");

/**
 * Decodes JWT token in req.data into JSON.
 * Throws error `invalidAccessToken` if token could not be decoded. 
 */
class DecodeToken {

	handle(req) {
		let res;

		try {
			res = {
				reqId: req.reqId,
				status: 200,
				data: jwt.decode(req.data)
			};
		} catch (ex) {
			log.debug("Failed to decode JWT");
			res = errors.invalidAccessToken(ex.message);
		}

		return res;		
	}
}

module.exports = DecodeToken;
