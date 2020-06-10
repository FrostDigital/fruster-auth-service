const config = require("../../conf");
const confBackup = Object.assign({}, config);

class SpecUtils {

	constructor() { }

	static resetConfig() {
		Object.keys(confBackup)
			.forEach(conf => config[conf] = confBackup[conf]);
	}

}

module.exports = SpecUtils;
