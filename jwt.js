var jwt = require('jwt-simple');
var conf = require('./conf');
var _ = require('lodash');
var ms = require('ms');

module.exports = {
  encode: encode,
  decode: decode
};

function encode(user) {
  var o = _.merge({
    exp: calcExpiration()
  }, user);
  
  return jwt.encode(o, conf.secret);
}

function decode(token) {
  return jwt.decode(token, conf.secret);
}

function calcExpiration() {
  // Exp is seconds since epoch 
  return (Date.now() + ms(conf.accessTokenTTL)) / 1000;
}
