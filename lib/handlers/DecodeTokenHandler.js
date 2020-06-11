const log = require("fruster-log");
const errors = require("../deprecatedErrors");
const UserManager = require("../managers/UserManager");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const JWTManager = require("../managers/JWTManager");
const Utils = require("../utils/utils");

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
	 * @param {FrusterRequest} req
	 */
	async handle({ reqId, data,
		/* even though this is a service request, api-gateway has to send headers as `headers` since data is the token to decode */
		headers }) {
		// Decoded token contains id of the user it was generated for
		const decodedToken = await this._decodeToken(data);

		// Get fresh user object from user service
		const user = await UserManager.getUser(reqId, decodedToken.id);

		if (!user)
			throw errors.invalidAccessToken(`User with id ${decodedToken.id} does not exist`);

		const sessionDetails = Utils.getSessionDetailsFromHeaders(headers);

		/*
		  * We don't need to wait for this to speed up the process.
		  * If this fails it won't be much of a problem as the only thing being updated is `sessionDetails.lastActivity`
		  */
		this._jwtManager.updateSessionActivity(decodedToken, sessionDetails).catch(err => log.warn(err));

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
