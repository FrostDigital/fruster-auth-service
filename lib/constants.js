module.exports = {

	SERVICE_NAME: "auth-service",

	collection: {

		REFRESH_TOKENS: "refresh-tokens",
		SESSIONS: "sessions"

	},

	endpoints: {

		http: {

			LOGIN_WITH_COOKIE: "http.post.auth.cookie",
			LOGIN_WITH_TOKEN: "http.post.auth.token",
			CONVERT_TOKEN_TO_COOKIE: "http.get.auth.token-to-cookie",
			REFRESH_AUTH: "http.post.auth.refresh",
			LOGOUT: "http.*.auth.logout",
			GET_ACTIVE_SESSIONS: "http.get.auth.active-sessions"

		},

		service: {

			DECODE_TOKEN: "auth-service.decode-token",
			GENERATE_TOKEN_FOR_USER_COOKIE: "auth-service.generate-jwt-token-for-user.cookie",
			GENERATE_TOKEN_FOR_USER_TOKEN: "auth-service.generate-jwt-token-for-user.token",
			LOGOUT_USERS_BY_ID: "auth-service.logout-users-by-id",
			GET_SESSION_DETAILS_BY_USER_ID: "auth-service.get-session-details-by-user-id",
			REFRESH_AUTH: "auth-service.refresh-token",

		}

	}

};
