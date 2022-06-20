const log = require("fruster-log");
const authService = require("./auth-service");
const conf = require("./conf");

const health = require("fruster-health");

authService
	.start(conf.bus, conf.mongoUrl)
	.then(function () {
		health.start();
		log.info("Auth service started and connected to bus", conf.bus);
	})
	.catch(function (err) {
		log.error("Failed starting auth service", err);
		process.exit(1);
	});
