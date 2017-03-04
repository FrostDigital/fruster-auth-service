const jwt = require("./jwt");
const errors = require("../../errors");
const log = require("fruster-log");
const conf = require("../../conf");

let utils = module.exports;

/**
 * Decodes JWT token in req.data into JSON.
 * Throws error `invalidAccessToken` if token could not be decoded. 
 */
utils.decodeToken = (req) => {
	var res;

	try {
		res = createResponse(200, {
			data: jwt.decode(req.data)
		});
	} catch (ex) {
		log.debug("Failed to decode JWT");
		res = errors.invalidAccessToken(ex.message);
	}

	return res;
};


utils.validateCredentialsFormat = (credentials) => {
	function isValidLength(str, minLength) {
		return str && str.length >= minLength;
	}

	if (!isValidLength(credentials.username, conf.usernameMinLength)) {
		throw errors.invalidUsernameFormat(credentials.username);
	}

	if (!isValidLength(credentials.password, conf.passwordMinLength)) {
		throw errors.invalidPasswordFormat();
	}
};

utils.getWhitelistedUser = (user) => {
	if (Array.isArray(user)) {
		// User may come as array or object, make sure to handle both cases
		user = user[0];
	}

	let oUser = {};

	conf.userAttrsWhitelist.forEach((attr) => {
		if (user[attr] != undefined) {
			oUser[attr] = user[attr];
		} else {
			log.warn("Unmatched whitelisted attribute", attr);
		}
	});

	// safety net
	if (oUser.password) {
		log.warn("Password is not allowed in JWT token - removing it!");
		delete oUser.password;
	}

	return oUser;
};