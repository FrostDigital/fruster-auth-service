const uuid = require("uuid");
const serviceId = "auth-service";

const errorCode = {
    invalidUsernameFormat: serviceId + ".400.1",
    invalidPasswordFormat: serviceId + ".400.2",
    invalidAccessToken: serviceId + ".403.1",
    refreshTokenExpired: serviceId + ".420.1",
    refrehTokenNotFound: serviceId + ".404.1",
    userNotFound: serviceId + ".404.2",
    missingRefreshToken: serviceId + ".400.6",
    unexpectedError: serviceId + ".500.1"
};

module.exports = {

    code: errorCode,

    missingRefreshToken: function () {
        return err(400, errorCode.missingRefreshToken, "Refresh token not provided");
    },

    refreshTokenNotFound: function () {
        return err(404, errorCode.refrehTokenNotFound, "Refresh token not found");
    },

    refreshTokenExpired: function (token) {
        return err(420, errorCode.refreshTokenExpired, "Refresh token expired",
            "Refresh token \"" + token.token + "\" is expired " + (token.expired ? "by flag" : "since " + token.expires));
    },

    unexpectedError: function (detail) {
        return err(500, errorCode.unexpectedError, "Unexpected error", detail);
    },

    invalidPasswordFormat: function () {
        return err(400, errorCode.invalidPasswordFormat, "Invalid password format");
    },

    invalidUsernameFormat: function (username) {
        return err(400, errorCode.invalidUsernameFormat, "Invalid username format", "Invalid username: " + username);
    },

    invalidAccessToken: function (detail) {
        return err(403, errorCode.invalidAccessToken, "Invalid JWT token", detail);
    },

    userNotFound: function (detail) {
        return err(404, errorCode.userNotFound, "User not found", detail);
    }

};

function err(status, code, title, detail) {
    var e = {
        status: status,
        error: {
            code: code,
            id: uuid.v4(),
            title: title
        }
    };

    if (detail) {
        e.error.detail = detail;
    }

    return e;
}

