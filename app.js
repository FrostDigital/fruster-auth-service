var log = require('./log');
var authService = require('./auth-service');

authService
  .start(conf.bus)
  .then(function() {
    log.info('Auth service started and connected to bus', conf.bus);
  })
  .error(function(err) {
    log.error('Failed starting auth service', err);
    process.exit(1);
  });

