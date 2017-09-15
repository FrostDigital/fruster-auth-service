const jwt = require("jwt-simple");
const conf = require("../../conf");
const ms = require("ms");

module.exports = {
  encode: encode,
  decode: decode
};

function encode(user, expiresInMs) {
  let o = Object.assign({
    exp: calcExpiration(expiresInMs)
  }, user);
  
  return jwt.encode(o, conf.secret);
}

function decode(token) {
  return jwt.decode(token, conf.secret);
}

function calcExpiration(expiresInMs) {
  // Exp is seconds since epoch 
  return (Date.now() + expiresInMs) / 1000;
}
