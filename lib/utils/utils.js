const errors = require("../errors");
const log = require("fruster-log");
const conf = require("../../conf");
const FrusterRequest = require("fruster-bus").FrusterRequest;


class Utils {

	/**
	 * @param {Object} user 
	 */
	static getWhitelistedUser(user) {
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