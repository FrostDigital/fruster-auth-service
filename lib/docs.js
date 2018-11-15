module.exports = {

	http: {

		LOGIN_WITH_COOKIE: {
			description: `Login for web applications. Logs in with username and password and return \`JWT\` in \`Set-Cookie\` header. Returns user data in the response body, same as [user-service.get-users-by-query](#user-service.get-users-by-query) with \`expand: "profile"\` but for the logged in user.`,
			errors: {
				"auth-service.400.1": "Invalid username format",
				"auth-service.400.2": "Invalid password format",
				"user-service.401.3": "Invalid username or password"
			}
		},

		LOGIN_WITH_TOKEN: {
			description: `Login for non web devices such as native mobile apps. Returns an access token to be used as bearer authentication. Response body also contains \`profile\` which has the same data as [user-service.get-users-by-query](#user-service.get-users-by-query) with \`expand: "profile"\` but for the logged in user.`,
			errors: {
				"auth-service.400.1": "Invalid username format",
				"auth-service.400.2": "Invalid password format",
				"user-service.401.3": "Invalid username or password"
			}
		},

		CONVERT_TOKEN_TO_COOKIE: {
			description: `Converts inputted token to a cookie with a \`Set-Cookie\` response. To be used mainly when using web views in apps where the user needs to be authenticated. Is used by providing a Bearer access token in the normal app way (\`authorization: Bearer {accesstoken}\`). Returns user data in the response body, same as [user-service.get-users-by-query](#user-service.get-users-by-query) with \`expand: "profile"\` but for the logged in user. Returns status 200 if no redirect is provided and 303 if redirect is provided (Which should automatically redirect any browser to the url in the redirect query param).

*Note:*

	- The token is still valid after request
	- The cookie and token share the same session (meaning a logout with the token will log out the cookie as well, and vice versa)`,
			query: {
				redirect: "an optional url to redirect to after conversion is done (e.g. the url of the page you want to display in the webview in the app where you need to be authenticated)"
			},
			errors: {
				"auth-service.403.1": "Invalid JWT token"
			}
		},

		REFRESH_AUTH: {
			description: "Gets a fresh access token by providing a refresh token.",
			errors: {
				"auth-service.404.1": "Refresh token not found",
				"auth-service.420.1": "Refresh token expired",
				"auth-service.400.6": "Refresh token not provided"
			}
		},

		LOGOUT: {
			description: "Will return a `Set-Cookie` to instruct browser to expire any existing cookie and delete the session of the token (from cookie or Authorization Bearer-header) from the database. Should be used by both Token and Cookie.",
			query: {
				logoutAll: "Logs all active sessions out for the logged in user."
			}
		}

	},

	service: {

		DECODE_TOKEN: {
			description: "Decodes a `jwt` token.",
			errors: {
				"auth-service.403.1": "Invalid JWT token"
			}
		}

	},

	shared: {

		GENERATE_TOKEN_FOR_USER: {
			description: "Generates a web JWT token for a user matching the inputted Mongo query. Used for external logins.",
			errors: {
				"auth-service.404.2": "User not found"
			}
		}

	}

};
