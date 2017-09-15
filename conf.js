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

  // Attributes on user object to use in JWT token
  userAttrsWhitelist: parseArray(process.env.USER_ATTRS_WHITELIST) || ["id", "firstName", "lastName", "email", "scopes", "roles"],

  // How long JWT cookie will survive
  jwtCookieAge: process.env.JWT_COOKIE_AGE || "10d",

  // Domain that JWT Cookie is valid for
  jwtCookieDomain: process.env.JWT_COOKIE_DOMAIN || null,

  // If JWT cookie should be HTTP only. This should only be disabled during test
  jwtCookieHttpOnly: (process.env.JWT_COOKIE_HTTP_ONLY || "true") == "true",

  // How long access token is valid
  accessTokenTTL: process.env.ACCESS_TOKEN_TTL || "1d",

  // How long a refresh token is valid
  refreshTokenTTL: process.env.REFRESH_TOKEN_TTL || "365d",

  // Mongo database URL
  mongoUrl: process.env.MONGO_URL || "mongodb://localhost:27017/auth-service",

  refreshTokenCollection: "refresh-tokens",

  userServiceGetUserSubject: process.env.USER_SERVICE_GET_USER_SUBJECT || "user-service.get-user"

};

function parseArray(str) {
  if (str) {
    return str.split(",");
  }
  return null;
}