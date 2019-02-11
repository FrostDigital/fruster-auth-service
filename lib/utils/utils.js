const log = require("fruster-log");
const conf = require("../../conf");


class Utils {

	/**
	 * @param {Object} user
	 */
	static getWhitelistedUser(user) {
		const oUser = {};

		conf.userAttrsWhitelist.forEach((attr) => {
			if (attr.includes("profile.") && !!user.profile) {
				const profileAttr = attr.replace("profile.", "");

				if (!oUser.profile)
					oUser.profile = {};

				if (user.profile[profileAttr] !== undefined)
					oUser.profile[profileAttr] = user.profile[profileAttr];
			} else if (user[attr] !== undefined) {
				oUser[attr] = user[attr];
			} else {
				log.warn("Unmatched whitelisted attribute", attr);
			}
		});

		// safety net
		{
			if (oUser.password) {
				log.warn("Password is not allowed in JWT token - removing it!");
				delete oUser.password;
			}

			if (oUser.salt) {
				log.warn("Salt is not allowed in JWT token - removing it!");
				delete oUser.salt;
			}

			if (oUser.hashDate) {
				log.warn("Hash date is not allowed in JWT token - removing it!");
				delete oUser.hashDate;
			}
		}

		return oUser;
	};

}

module.exports = Utils;
