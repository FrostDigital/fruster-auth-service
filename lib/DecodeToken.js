const log = require("fruster-log");
const jwt = require("./utils/jwt");
const errors = require("../errors");
const UserServiceClient = require("./clients/UserServiceClient");

/**
 * Decodes JWT token in req.data into JSON.
 * Throws error `invalidAccessToken` if token could not be decoded. 
 */
class DecodeToken {

	constructor() {
		this.userService = new UserServiceClient();
	}
	
	async handle(req) {
		let res;

		// Decoded token contains user profile as it were when token was created.
		const decodedToken = this._decodeToken(req.data);		
		
		// Get fresh user object from user service
		const user = await this.userService.getUser(req.reqId, decodedToken.id);

		if (!user) {
			throw errors.invalidAccessToken(`User with id ${decodedToken.id} does not exist`);
		}

		return {
			status: 200,
			data: user
		};
	}

	/**
	 * Decode jwt token. This will also check if token is expired.
	 * 
	 * @param {String} rawToken 
	 */
	_decodeToken(rawToken) {
		let decodedToken;

		try {	
			decodedToken = jwt.decode(rawToken);
		} catch (ex) {
			log.debug("Failed to decode JWT");
			throw errors.invalidAccessToken(ex.message);
		}

		return decodedToken;
	}
}

module.exports = DecodeToken;
