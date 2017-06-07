const utils = require("./utils/utils");
const ms = require("ms");
const jwt = require("./utils/jwt");
const conf = require("../conf");
const errors = require("../errors");
const BaseLoginHandler = require("./BaseLoginHandler");

class TokenLogin extends BaseLoginHandler {

	constructor(refreshTokenRepo) {		
		super();	
		this.refreshTokenRepo = refreshTokenRepo;
	}

	login(userToLogin, reqId) {		
		const whitelistedUser = utils.getWhitelistedUser(userToLogin);
				
		let authData = {
			accessToken: jwt.encode(whitelistedUser),
			profile: whitelistedUser								
		};

		return this.refreshTokenRepo.create(whitelistedUser.id, ms(conf.refreshTokenTTL))
			.then((refreshToken) => {
				authData.refreshToken = refreshToken.token;
				
				return {
					reqId: reqId,
					status: 200,
					data: authData
				};
			})
			.catch((err) => {
				console.log(err);
				throw errors.unexpectedError("Failed saving refresh token");
			});
	}

}

module.exports = TokenLogin;