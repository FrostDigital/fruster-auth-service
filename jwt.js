var jwt = require('jwt-simple');
var conf = require('./conf');

module.exports = {
  encode: encode,
  decode: decode
};

function encode(user) {
  return jwt.encode(user, conf.secret);
}

function decode(token) {
  return jwt.decode(token, conf.secret);
}
