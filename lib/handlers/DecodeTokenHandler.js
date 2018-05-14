const log = require("fruster-log");
const errors = require("../errors");
const UserServiceClient = require("../clients/UserServiceClient");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const JWTManager = require("../managers/JWTManager");


/**
 * Decodes JWT token in req.data into JSON.
 * Throws error `invalidAccessToken` if token could not be decoded. 
 */
class DecodeTokenHandler {

	/**
	 * @param {JWTManager} jwtManager 
	 */
	constructor(jwtManager) {
		this._jwtManager = jwtManager;
		this._userService = new UserServiceClient();
	}

	/**
	 * 
	 * @param {FrusterRequest} req 
	 */
	async handle(req) {
		// Decoded token contains user profile as it were when token was created.
		const decodedToken = await this._decodeToken(req.data);

		// Get fresh user object from user service
		const user = await this._userService.getUser(req.reqId, decodedToken.id);

		if (!user)
			throw errors.invalidAccessToken(`User with id ${decodedToken.id} does not exist`);

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
	async _decodeToken(rawToken) {
		let decodedToken;

		try {
			decodedToken = await this._jwtManager.decode(rawToken);
		} catch (err) {
			log.debug("Failed to decode JWT");
			throw errors.invalidAccessToken(err.message);
		}

		return decodedToken;
	}
}

module.exports = DecodeTokenHandler;
