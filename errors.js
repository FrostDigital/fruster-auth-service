const uuid = require('uuid');

const errorCode = {
  invalidUsernameFormat: 4001,
  invalidPasswordFormat: 4002,
  invalidAccessToken: 4031,
  refreshTokenExpired: 4201,
  refrehTokenNotFound: 4041, 
  missingRefreshToken: 4006,
  unexpectedError: 5001
};

module.exports = {

  code: errorCode,

  missingRefreshToken: function() {
    return err(400, errorCode.missingRefreshToken, 'Refresh token not provided');
  },

  refreshTokenNotFound: function() {
    return err(404, errorCode.refrehTokenNotFound, 'Refresh token not found');  
  },

  refreshTokenExpired: function(token) {
    return err(420, errorCode.refreshTokenExpired, 'Refresh token expired', 
      'Refresh token "' + token.token + '" is expired ' + (token.expired ? 'by flag' : 'since ' + token.expires)); 
  },

  unexpectedError: function(detail) {
    return err(500, errorCode.unexpectedError, 'Unexpected error', detail);
  },

  invalidPasswordFormat: function() {
    return err(400, errorCode.invalidPasswordFormat, 'Invalid password format');    
  },

  invalidUsernameFormat: function(username) {
    return err(400, errorCode.invalidUsernameFormat, 'Invalid username format', 'Invalid username: ' + username);
  },

  invalidAccessToken: function() {
    return err(403, errorCode.invalidAccessToken, 'Invalid JWT token');
  }

};

function err(status, code, title, detail) {  
  var e = {
    status: status,
    error: {
      code: code,
      id: uuid.v4(),
      title: title
    }
  };

  if(detail) {
    e.error.detail = detail;
  }

  return e;
}

