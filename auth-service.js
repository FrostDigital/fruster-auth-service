'use strict';

var conf = require('./conf');
var log = require('./log');
var uuid = require('uuid');
var _ = require('lodash');
var bus = require('fruster-bus');
var jwt = require('./jwt');
var ms = require('ms');

var ERR_CODE_INVALID_USERNAME_FORMAT = 4001,
    ERR_CODE_INVALID_PASSWORD_FORMAT = 4002,
    ERR_CODE_UNEXPECTED_AUTH_ERROR = 5001;

// TODO: Login for web
// TODO: Decode JWT token

module.exports.start = function(busAddress) {  
  return bus.connect(busAddress).then(function() {
    bus.subscribe('http.post.auth.login.web', loginWeb);
    // bus.subscribe('http.post.auth.login.app', loginApp);
    // bus.subscribe('auth.decode', decodeToken);      
  });
};

function loginWeb(req) {
  var login = req.data;

  if(!isValidLength(login.username, conf.usernameMinLength)) {
    return createMsg(400, req.reqId, { 
      code: ERR_CODE_INVALID_USERNAME_FORMAT, 
      title: 'Invalid username format',
      detail: 'Username is to short: ' + login.username
    });
  }

  if(!isValidLength(login.password, conf.passwordMinLength)) {
    return createMsg(400, req.reqId, { 
      code: ERR_CODE_INVALID_PASSWORD_FORMAT, 
      title: 'Invalid password format'
    });
  }

  function handleAuthError(err) {
    log.debug('User service failed validating username/password', err.status);

    if(err.status !== 401 && err.status !== 403) {
      log.warn('Recieved unexpected error from user service', err);
      
      return createError(500, req.reqId, { 
        code: ERR_CODE_UNEXPECTED_AUTH_ERROR, 
        title: 'Unexpected error while validating password', 
        detail: err.detail 
      });
    }

    return err;
  }

  function handleAuthSuccess(res) {    
    log.debug('Successfully authenticated user', login.username);

    res.headers = {
      'Set-Cookie': bakeCookie(jwt.encode(res.data), ms(conf.jwtCookieAge))
    };
    return res;
  }
  
  return bus
    .request('user.validate-password', { reqId: req.reqId, data: login })
    .then(handleAuthSuccess)
    .catch(handleAuthError);  
}

function bakeCookie(jwt, expiresInMs) {
  var d = new Date();
  d.setTime(d.getTime() + expiresInMs); 
  return 'jwt=' + jwt + ';path=/;expires=' + d.toGMTString() + '; HttpOnly;';
}

function isValidLength(str, minLength) {
  return str && str.length >= minLength;
}

function createError(status, reqId, error) {
  error.id = uuid.v4();
  return createMsg(status, reqId, { error: error });
}

function createMsg(status, reqId, msg) {
  return _.extend({}, msg, {
    reqId: reqId,
    status: status
  });
}