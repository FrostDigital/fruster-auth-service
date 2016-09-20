const log = require('fruster-log');
const authService = require('./auth-service');
const conf = require('./conf');

authService
  .start(conf.bus, conf.mongoUrl)
  .then(function() {
    log.info('Auth service started and connected to bus', conf.bus);
  })
  .error(function(err) {
    log.error('Failed starting auth service', err);
    process.exit(1);
  });

