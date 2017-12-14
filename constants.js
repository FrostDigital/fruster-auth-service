module.exports = {

	jwtCookieName: "jwt",

	collection: {
		refreshTokens: "refresh-tokens"
	},

	consuming: {
		validatePassword: "user-service.validate-password"
	},

	endpoints: {

		http: {

			LOGIN_WITH_COOKIE: "http.post.auth.cookie",
			LOGIN_WITH_TOKEN: "http.post.auth.token",
			REFRESH_AUTH: "http.post.auth.refresh",
			LOGOUT: "http.*.auth.logout"

		},

		service: {

			DECODE_TOKEN: "auth-service.decode-token",
			GENERATE_TOKEN_FOR_USER_COOKIE: "auth-service.generate-jwt-token-for-user.cookie",
			GENERATE_TOKEN_FOR_USER_TOKEN: "auth-service.generate-jwt-token-for-user.token"

		}

	}

};
