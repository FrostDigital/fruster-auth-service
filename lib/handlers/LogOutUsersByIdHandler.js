const FrusterRequest = require("fruster-bus").FrusterRequest;
const JWTManager = require("../managers/JWTManager");


class LogOutUsersByIdHandler {

	/**
	 * @param {JWTManager} jwtManager
	 */
	constructor(jwtManager) {
		this._jwtManager = jwtManager;
	}

	/**
	 * @param {FrusterRequest} req
	 */
	async handle({ data: { userIds } }) {
		await this._jwtManager.removeAllForUsers(userIds);

		return { status: 200 }
	};
}

module.exports = LogOutUsersByIdHandler;
