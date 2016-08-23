'use strict';

var conf = require('./conf');
var log = require('./log');
var uuid = require('uuid');
var _ = require('lodash');
var bus = require('fruster-bus');
var jwt = require('./jwt');
var ms = require('ms');
var mongo = require('mongodb-bluebird');

var ERR_CODE_INVALID_USERNAME_FORMAT = 4001,
    ERR_CODE_INVALID_PASSWORD_FORMAT = 4002,
    ERR_CODE_UNEXPECTED_AUTH_ERROR = 5001;

var refreshTokensCollection;

module.exports.start = function(busAddress, mongoUrl) {  
  return bus.connect(busAddress)
    //.then(() => mongo.connect(mongoUrl))
    // .then(db => {
    //   refreshTokensCollection = db.collection(conf.refreshTokenCollection);
    // })
    .then(() => {
      bus.subscribe('http.post.auth.login.web', req => login(req, true));
      bus.subscribe('http.post.auth.login.app', req => login(req, false));      
      bus.subscribe('auth.decode', decodeToken);      
    });
};

function decodeToken(req) {
  // TODO
}

function login(req, isWeb) {
  var credentials = req.data;

  if(!isValidLength(credentials.username, conf.usernameMinLength)) {
    return createMsg(400, req.reqId, { 
      code: ERR_CODE_INVALID_USERNAME_FORMAT, 
      title: 'Invalid username format',
      detail: 'Username is to short: ' + credentials.username
    });
  }

  if(!isValidLength(credentials.password, conf.passwordMinLength)) {
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

  function loginWeb(res) {    
    log.debug('Successfully authenticated user', credentials.username);
    res.headers = {
      'Set-Cookie': bakeCookie(jwt.encode(res.data), ms(conf.jwtCookieAge))
    };
    return res;
  }

  function loginApp(res) {    
    res.data = {
      accessToken: jwt.encode(res.data),
      refreshToken: uuid.v4()
      // TODO: Return more user fields?
    };
    return res;
  }
  
  return bus
    .request('user.validate-password', { reqId: req.reqId, data: login })    
    .then(isWeb ? loginWeb : loginApp)
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