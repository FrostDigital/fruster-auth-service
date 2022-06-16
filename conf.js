module.exports = {

	// NATS servers, set multiple if using cluster
	// Example: `['nats://10.23.45.1:4222', 'nats://10.23.41.8:4222']`
	bus: parseArray(process.env.BUS) || ["nats://localhost:4222"],

	// Password min length
	passwordMinLength: process.env.PASSWORD_MIN_LENGTH || 6,

	// Username min lengtn
	// Does not apply if login in with email address
	usernameMinLength: process.env.USERNAME_MIN_LENGTH || 3,

	// JWT secret used to encode/decode tokens
	secret: process.env.JWT_SECRET || "fe1a1915a379f3be5394b64d14794932",

	// Attributes on user object to use in login response
	userAttrsWhitelist: parseArray(process.env.USER_ATTRS_WHITELIST) || ["id", "firstName", "lastName", "email", "scopes", "roles", "profile.firstName", "profile.lastName"],

	// Name of jwt cookie
	jwtCookieName: process.env.JWT_COOKIE_NAME || "jwt",

	// How long JWT cookie will survive
	/**@type {String} */
	jwtCookieAge: process.env.JWT_COOKIE_AGE || "10d",

	// Domain that JWT Cookie is valid for
	jwtCookieDomain: process.env.JWT_COOKIE_DOMAIN || null,

	// If JWT cookie should be HTTP only. This should only be disabled during test
	jwtCookieHttpOnly: (process.env.JWT_COOKIE_HTTP_ONLY || "true") == "true",

	// Browser cookies are support to keep max 4096 bytes. So additional payload size should not exceed this value.
	jwtAdditionalPayloadSize: Number.parseFloat(process.env.JWT_ADDITIONAL_PAYLOAD_SIZE || 3000),

	// How long access token is valid
	/** @type {String} */
	accessTokenTTL: process.env.ACCESS_TOKEN_TTL || "1d",

	// How long a refresh token is valid
	/** @type {String} */
	refreshTokenTTL: process.env.REFRESH_TOKEN_TTL || "365d",

	// Mongo database URL
	mongoUrl: process.env.MONGO_URL || "mongodb://localhost:27017/auth-service",

	/**
	 * The subject from which auth service will get the user data used for login responses / data sent with requests.
	  * If this is not default, a legacy call method will be used when fetching the user (To still support older projects) and no `expand` flag will be sent.
	  * It is up to the service answering to that subject to fetch the correct information if split user/profile data is used.
	  */
	userServiceGetUserSubject: process.env.USER_SERVICE_GET_USER_SUBJECT || "user-service.get-users-by-query",

	/** `user-service.get-users-by-query` response has `profile` attribute. This key for avoid duplicate profile keys */
	userDataResponseKey: process.env.USER_DATA_RESPONSE_KEY || "profile",

	/**
	 * The scope required to do impersonation. Is not set by default which means
	 * that impersonation is disabled.
	 */
	impersonationScope: process.env.IMPERSONATION_SCOPE,

};

function parseArray(str) {
	if (str) {
		return str.split(",");
	}
	return null;
}
