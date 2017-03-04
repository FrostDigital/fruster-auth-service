const jwt = require("jwt-simple");
const conf = require("../../conf");
const ms = require("ms");

module.exports = {
  encode: encode,
  decode: decode
};

function encode(user) {
  let o = Object.assign({
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
