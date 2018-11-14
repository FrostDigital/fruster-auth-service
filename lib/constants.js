module.exports = {

	collection: {

		REFRESH_TOKENS: "refresh-tokens",
		SESSIONS: "sessions"

	},

	endpoints: {

		http: {

			LOGIN_WITH_COOKIE: "http.post.auth.cookie",
			LOGIN_WITH_TOKEN: "http.post.auth.token",
			CONVERT_TOKEN_TO_COOKIE: "http.post.auth.token-to-cookie",
			REFRESH_AUTH: "http.post.auth.refresh",
			LOGOUT: "http.*.auth.logout"

		},

		service: {

			DECODE_TOKEN: "auth-service.decode-token",
			GENERATE_TOKEN_FOR_USER_COOKIE: "auth-service.generate-jwt-token-for-user.cookie",
			GENERATE_TOKEN_FOR_USER_TOKEN: "auth-service.generate-jwt-token-for-user.token"

		}

	},

	schemas: {

		request: {

			AUTH_REQUEST: "AuthRequest",
			REFRESH_AUTH: "RefreshTokenRequest",
			DECODE_TOKEN_REQUEST: "DecodeTokenRequest",
			GENERATE_JWT_TOKEN_FOR_USER_REQUEST: "GenerateJWTTokenForUserRequest"

		},

		response: {

			TOKEN_AUTH_RESPONSE: "TokenAuthResponse"

		}

	}

};
