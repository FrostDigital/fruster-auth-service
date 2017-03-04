const utils = require("./utils/utils");
const bus = require("fruster-bus");
const jwt = require("./utils/jwt");
const conf = require("../conf");
const errors = require("../errors");

class Refresh {

	constructor(refreshTokenRepo) {
		this.repo = refreshTokenRepo;
	}

	handle(req) {
		let refreshToken = req.data.refreshToken;

		if (!refreshToken) {
			return errors.missingRefreshToken();
		}

		return this.repo.get(refreshToken, true)
			.then(this._validateRefreshToken)
			.then((userId) => this._createNewAccessToken(userId, req.reqId))
			.then(accessToken => {
				return {
					status: 200,
					data: {
						accessToken: accessToken
					}
				};
			});
	}

	_validateRefreshToken(token) {
		if (!token) {
			throw errors.refreshTokenNotFound();
		} else if (token.expired || token.expires.getTime() < new Date().getTime()) {
			throw errors.refreshTokenExpired(token);
		}

		return token.userId;
	}

	_createNewAccessToken(userId, reqId) {
		return bus
			.request(conf.userServiceGetUserSubject, {
				reqId: reqId,
				data: {
					id: userId
				}
			})
			.then(userResp => {
				return jwt.encode(utils.getWhitelistedUser(userResp.data));
			});
	}
}

module.exports = Refresh;