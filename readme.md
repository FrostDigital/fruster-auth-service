# Fruster Auth Service

A configurable Auth Service that plays nice with [Fruster API Gateway](http://github.com/frostdigital/fruster-api-gateway).

It allows two forms of authentication:

* JWT token saved in cookie for web applications
* Short lived access token in conjunction with long lived refresh tokens for non web clients

Note that this service depends on a user service that exposes `user.get-user` action.

## Exposed actions

### Web login

Login for web applications. with `username` and `password` and return JWT in `Set-Cookie` header.

#### Subject

    http.post.auth.cookie

#### Request

    {
        // ...
        "data" {
            "username": "bob@frost.se",
            "password": "ZlatansPonyTail"
        }
    }

#### Success response

    {
        // ...
        "status": 200,
        "headers": {
            "Set-Cookie": "{jwt token}"
        }
    }

#### Failure response

* 401 Unauthorized
* 403 Not allowed
* 400 / 4001 Invalid password format
* 400 / 4002 Invalid username format
* 403 / 4002 Invalid access token
* 500 / 5001 Unexpected error

### Generate web JWT token for user

Generates a web JWT token for a user matching the inputted Mongo query. Used for external logins.

#### Subject

    auth-service.generate-jwt-token-for-user.cookie

#### Request

Mongo query for the user to generate JWT token for.

	{
		"id": "be69d4d8-b2d4-4907-865d-b433d9373c29"
	}

#### Success response
Same as [Web Login](https://github.com/FrostDigital/fruster-auth-service#web-login)

## App login

Login for non web devices such as native mobile apps.

#### Subject

    http.post.auth.token

#### Request

    {
        // ...
        "data" {
            "username": "bob@frost.se",
            "password": "ZlatansPonyTail"
        }
    }

#### Success response

    {
        // ...
        "status": 200,
        "data": {
            "accessToken": "{jwt token}",
            "refreshToken": "{jwt token}"
        }
    }

#### Failure response:

* 401 Unauthorized
* 403 Not allowed
* 400 / 4001 Invalid password format
* 400 / 4002 Invalid username format
* 500 / 5001 Unexpected error

### Generate app JWT token for user

Generates a web JWT token for a user matching the inputted Mongo query. Used for external logins.

#### Subject

    auth-service.generate-jwt-token-for-user.token

#### Request

Mongo query for the user to generate JWT token for.

	{
		"id": "be69d4d8-b2d4-4907-865d-b433d9373c29"
	}

#### Success response
Same as [App Login](https://github.com/FrostDigital/fruster-auth-service#app-login)

## Refresh access token

Get fresh access token by providing a refresh token.

#### Subject

    http.post.auth.refresh

#### Request

    {
        // ...
        "data": {
		"refreshToken": "{refresh token}"
		}
    }

#### Success response

    {
        // ...
        "status": 200,
        "data": {
            "accessToken": "{jwt token}"
        }
    }

#### Failure response:

* 400 / 4006 Refresh token not provided
* 404 / 4041 Refresh token not found
* 420 / 4031 Refresh token expired


### Decode JWT token

#### Subject

    auth.decode-access-token

#### Request

    {
        data: {
            token: "{jwt token to decrypt}"
        }
    }

#### Success response

    {
        status: 200,
        data: {
            // decrypted JWT token
        }
    }

#### Failure response

* 400 / 4006 Refresh token not provided
* 404 / 4041 Refresh token not found
* 420 / 4031 Refresh token expired


### Logout

Will return a Set-Cookie to instruct browser to expire any existing cookie.
In future this might remove accesstokens as well when they are saved in database.

#### Subject

    http.post.auth.logout


## Run

Install dependencies:

    npm install

Start server:

    npm start

During development `nodemon` is handy, it will watch and restart server when files changes:

    # If you haven't already installed, do it:
    npm install nodemon -g

    # Start watch - any change to the project will now restart the server, or typ `rs` to trigger restart manually.
    nodemon ./app.js

## Configuration

Configuration is set with environment variables. All config defaults to values that makes sense for development.

    # Mongo database URL
    MONGO_URL = "mongodb://localhost:27017"

    # Applications log level (error|warn|info|debug|silly)
    LOG_LEVEL = "debug"

    # NATS servers, set multiple if using cluster
    # Example: `"nats://10.23.45.1:4222,nats://10.23.41.8:4222"`
    BUS = "nats://localhost:4222"

    # How long refresh token is valid
    REFRESH_TOKEN_TTL = "365d"

    # How long access token is valid
    ACCESS_TOKEN_TTL = "1d"

    USER_SERVICE_GET_USER_SUBJECT = "user-service.get-user"

    # JWT secret used to encode/decode tokens
    JWT_SECRET = "fe1a1915a379f3be5394b64d14794932"

    # Domain for JWT cookie, use dot for wildcard, example ".frost.se"
    JWT_COOKIE_DOMAIN = "localhost"

    # If JWT cookie should be HTTP only. This should only be disabled during test!
    JWT_COOKIE_HTTP_ONLY = "true"

    # Access token cookie expiration (only used for web auth)
    ACCESS_TOKEN_COOKIE_AGE = "10d",

    # Attributes on user object to use in JWT token
    USER_ATTRS_WHITELIST = "id,firstName,lastName,email,scopes,roles"
