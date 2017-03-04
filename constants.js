module.exports = {

	jwtCookieName: "jwt",

	collection: {
		refreshTokens: "refresh-tokens"
	},

	consuming: {
		validatePassword: "user-service.validate-password"
	}

};
