module.exports = {

    http: {

        LOGIN_WITH_COOKIE: {
            description: "Login for web applications. Logs in with username and password and return JWT in Set-Cookie header.",
            errors: {
                "auth-service.400.1": "Invalid username format",
                "auth-service.400.2": "Invalid password format"
            }
        },

        LOGIN_WITH_TOKEN: {
            description: "Login for non web devices such as native mobile apps. Returns an access token to be used as bearer authentication.",
            errors: {
                "auth-service.400.1": "Invalid username format",
                "auth-service.400.2": "Invalid password format"
            }
        },

        REFRESH_AUTH: {
            description: "Gets a fresh access token by providing a refresh token.",
            errors: {
                "auth-service.404.1": "Refresh token not found",
                "auth-service.420.1": "Refresh token expired",
                "auth-service.400.6": "Refresh token not provided"
            }
        },

        LOGOUT: {
            description: "Will return a Set-Cookie to instruct browser to expire any existing cookie. In future this might remove accesstokens as well when they are saved in database. When being logged in with token there is no need to logout, just remove that token from where it is saved.7"
        }

    },

    service: {

        DECODE_TOKEN: {
            description: "Decodes a jwt token.",
            errors: {
                "auth-service.403.1": "Invalid JWT token"
            }
        }

    },

    shared: {

        GENERATE_TOKEN_FOR_USER: {
            description: "Generates a web JWT token for a user matching the inputted Mongo query. Used for external logins.",
            errors: {
                "auth-service.404.2": "User not found"
            }
        }

    }

};