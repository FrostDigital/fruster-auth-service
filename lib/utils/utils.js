const jwt = require("./jwt");
const errors = require("../errors");
const log = require("fruster-log");
const conf = require("../../conf");
const FrusterRequest = require("fruster-bus").FrusterRequest;


class Utils {

	/**
	 * @param {Object} credentials
	 * @param {String} credentials.username
	 * @param {String} credentials.password
	 */
	static validateCredentialsFormat(credentials) {
		function isValidLength(str, minLength) {
			return str && str.length >= minLength;
		}

		if (!isValidLength(credentials.username, conf.usernameMinLength))
			throw errors.invalidUsernameFormat(credentials.username);

		if (!isValidLength(credentials.password, conf.passwordMinLength))
			throw errors.invalidPasswordFormat();
	};

	/**
	 * @param {Object} user 
	 */
	static getWhitelistedUser(user) {
		if (Array.isArray(user))
			// User may come as array or object, make sure to handle both cases
			user = user[0];

		const oUser = {};

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

}

module.exports = Utils;