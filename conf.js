module.exports = {
  
  // NATS servers, set multiple if using cluster
  // Example: `['nats://10.23.45.1:4222', 'nats://10.23.41.8:4222']`
  bus: parseArray(process.env.BUS) || ['nats://localhost:4222'],

  // Applications log level (error|warn|info|debug|silly)
  logLevel: parseLogLevel(process.env.LOG_LEVEL) || 'debug',

  // Mongo database URL
  database: process.env.DATABASE || 'localhost:4321',

  // Password min length
  passwordMinLength: process.env.PASSWORD_MIN_LENGTH || 6,

  // Username min lengtn
  // Does not apply if login in with email address
  usernameMinLength: process.env.USERNAME_MIN_LENGTH || 3,

  // JWT secret used to encode/decode tokens
  secret: process.env.JWT_SECRET || 'fe1a1915a379f3be5394b64d14794932',

  // Attributes on user object to use in JWT token
  userAttrsWhitelist: parseArray(process.env.USER_ATTRS_WHITELIST) || ['id', 'firstName', 'lastName', 'mail'],

  // How long JWT cookie will survive
  jwtCookieAge: process.env.JWT_COOKIE_AGE || '10d',

  // Mongo database URL
  mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017',

  refreshTokenCollection: 'refresh-tokens'
  
};

// function parseBool(str, defaultVal) {
//   return !str ? defaultVal : str === 'true';
// }

function parseArray(str) {
  if(str) {
    return str.split(',');
  }
  return null;
}

function parseLogLevel(str) {
  if(str) {
    // align log level naming so trace -> silly (which is winston specific)
    return str.toLowerCase() === 'trace' ? 'silly' : str;    
  }
}