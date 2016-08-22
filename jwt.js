var jwt = require('jwt-simple');
var conf = require('./conf');
var _ = require('lodash');
var log = require('./log');

module.exports = {
  encode: encodeUser,
  decode: decodeUser
};

function encodeUser(user) {
  return jwt.encode(getWhitelistedUser(user), conf.secret);
}

function decodeUser(token) {
  return jwt.decode(token, conf.secret);
}

function getWhitelistedUser(user) {
  var oUser = {};
  
  _.each(conf.userAttrsWhitelist, function(attr) {
    if(_.has(user, attr)) {
      oUser[attr] = user[attr];      
    } else {
      log.warn('Unmatched whitelisted attribute', attr);
    }
  });

  // safety net
  if(oUser.password) {
    log.warn('Password is not allowed in JWT token - removing it!');
    delete oUser.password;
  }

  return oUser;
}