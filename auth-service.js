'use strict';

var conf = require('./conf');
var log = require('./log');
var uuid = require('uuid');
var _ = require('lodash');
var bus = require('fruster-bus');
var jwt = require('./jwt');
var ms = require('ms');
var mongo = require('mongodb-bluebird');
var errors = require('./errors');

var refreshTokensCollection;

module.exports.start = function (busAddress, mongoUrl)  {
  return bus.connect(busAddress)
    .then(() => mongo.connect(mongoUrl))
    .then(db => {
      refreshTokensCollection = db.collection(conf.refreshTokenCollection);
    })
    .then(() =>  {
      bus.subscribe('http.post.auth.web', req => login(req, true));
      bus.subscribe('http.post.auth.app', req => login(req, false));
      bus.subscribe('http.post.auth.refresh', refreshAccessToken);
      bus.subscribe('auth-service.decode-token', decodeToken);
    })
    .then(() => log.info('Auth service is up and running'));
};

/**
 * Decodes JWT token in req.data into JSON.
 * Throws error `invalidAccessToken` if token could not be decoded. 
 */
function decodeToken(req) {
  var res;

  try {
    res = createResponse(200, {
      data: jwt.decode(req.data)
    });
  } catch (ex) {
    log.debug('Failed to decode JWT');
    res = errors.invalidAccessToken();
  }

  return res;
}

/**
 * Returns a new access token from given refresh token.
 * Will throw error if refresh token is missing, invalid or expired.
 */
function refreshAccessToken(req) {
  var refreshToken = req.data.refreshToken;

  if (!refreshToken) {
    return errors.missingRefreshToken();
  }

  return refreshTokensCollection
    .findOne({
      token: refreshToken
    })
    .then(validateRefreshToken)
    .then(userId => createNewAccessToken(userId))
    .then(accessToken => createResponse(200, {
      data: accessToken
    }));
}

function validateRefreshToken(token) {
  var err;

  if (!token) {
    err = errors.refreshTokenNotFound();
  } else if (token.expired || token.expires.getTime() < new Date().getTime()) {
    err = errors.refreshTokenExpired(token);
  }

  if (err) {
    log.debug(err.error.detail);
    throw err;
  }

  return token.userId;
}

function login(req, isWeb) {
  var credentials = req.data;

  if (!isValidLength(credentials.username, conf.usernameMinLength)) {
    return errors.invalidUsernameFormat(credentials.username);
  }

  if (!isValidLength(credentials.password, conf.passwordMinLength)) {
    return errors.invalidPasswordFormat();
  }

  function handleAuthError(err) {
    log.debug('User service failed validating username/password', err.status);

    if (err.status !== 401 && err.status !== 403) {
      log.warn('Recieved unexpected error from user service', err);
      return errors.unexpectedError(err.detail);
    }

    return err;
  }

  function loginWeb(res) {
    log.debug('Successfully authenticated user', credentials.username);

    var whitelistedUser = getWhitelistedUser(res.data);

    res.headers = {
      'Set-Cookie': bakeCookie(jwt.encode(whitelistedUser), ms(conf.jwtCookieAge))
    };

    res.data = whitelistedUser;

    return res;
  }

  function loginApp(res) {
    var whitelistedUser = getWhitelistedUser(res.data);
    var refreshToken = uuid.v4();

    res.data = {
      accessToken: jwt.encode(whitelistedUser),
      refreshToken: refreshToken,
      profile: whitelistedUser
    };

    return saveRefreshToken(refreshToken, whitelistedUser.id)
      .then(() => res)
      .catch(errors.unexpectedError('Failed saving refresh token'));
  }

  return bus
    .request('user-service.validate-password', {
      reqId: req.reqId,
      data: credentials
    })
    .then(isWeb ? loginWeb : loginApp)
    .catch(handleAuthError);
}

function saveRefreshToken(token, userId) {
  return refreshTokensCollection.insert({
    _id: uuid.v4(),
    token: token,
    userId: userId,
    expired: false,
    expires: new Date(new Date().getTime() + conf.refreshTokenTTL)
  });
}


function bakeCookie(jwt, expiresInMs) {
  var d = new Date();
  d.setTime(d.getTime() + expiresInMs);
  return 'jwt=' + jwt + ';path=/;expires=' + d.toGMTString() + '; HttpOnly;';
}

function isValidLength(str, minLength) {
  return str && str.length >= minLength;
}

function createResponse(status, msg)  {
  return _.extend({}, msg, {
    status: status
  });
}

function getWhitelistedUser(user) {
  var oUser = {};

  _.each(conf.userAttrsWhitelist, function (attr)  {
    if (_.has(user, attr)) {
      oUser[attr] = user[attr];
    } else {
      log.warn('Unmatched whitelisted attribute', attr);
    }
  });

  // safety net
  if (oUser.password) {
    log.warn('Password is not allowed in JWT token - removing it!');
    delete oUser.password;
  }

  return oUser;
}

function createNewAccessToken(userId) {
  return bus
    .request('user-service.get', {
      id: userId
    })
    .then(userResp => {
      return jwt.encode(getWhitelistedUser(userResp.data));
    });
}