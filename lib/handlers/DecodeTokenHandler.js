const log = require("fruster-log");
const errors = require("../deprecatedErrors");
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
	}

	/**
	 *
	 * @param {FrusterRequest} req
	 */
	async handle(req) {
		// Decoded token contains id of the user it was generated for
		const decodedToken = await this._decodeToken(req.data);

		// Get fresh user object from user service
		const user = await UserServiceClient.getUser(req.reqId, decodedToken.id);

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
