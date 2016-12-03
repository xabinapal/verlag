;(function() {
  'use strict';

  const path = require('path');

  const _models = ['menu', 'page', 'category', 'publication'];
  const _modules = ['markdown', 'form', 'mailer', 'menu', 'catalog'];

  module.exports = (function() {
    let serverDefaults = {
      port: 3000,
      onError: onError,
      onListening: onListening,
      databaseConnection: 'mongodb://localhost/verlag',

      viewsPath: undefined,
      viewEngine: 'pug',

      pageView: 'page',
      errorView: 'error',

      logFile: null
    };

    let appDefaults = {
      appTitle: 'verlag',
      staticPath: 'static/'
    };

    let serverLogger;

    let app, http, mongoose;
    let server, instance;

    let serverOptions, appOptions;
    let extraModules;

    class Verlag {
      constructor(options) {
        app = require('./app');
        http = require('http');

        mongoose = require('mongoose');
        mongoose.Promise = global.Promise;

        serverOptions = Object.assign({}, serverDefaults);
        appOptions = Object.assign({}, appDefaults);
      }

      setServerOptions(opts) {
        Object.assign(serverOptions, opts);
      }

      setAppOptions(opts) {
        Object.assign(appOptions, opts);
      }

      startServer() {
        const logger = require('./logger')(serverOptions.logFile);
        let mainLogger = new logger('verlag');
        serverLogger = mainLogger.create('server');

        serverLogger.log(serverLogger.info, 'starting server...');

        let models = Object.create(null);

        serverLogger.log(serverLogger.debug, 'opening database connection...');
        mongoose.connect(serverOptions.databaseConnection);

        const db = mongoose.connection;
        db.on('error', () => serverLogger.log(serverLogger.error, 'error opening database connection'));
        db.once('open', function() {
          serverLogger.log(serverLogger.debug, 'database connection opened');
          _models.forEach(function(model) {
            let m = path.join(__dirname, 'models', model);
            models[model] = require(m)(mongoose);
          });

          let modules = _modules.map(path.join(__dirname, 'verlag_modules', module));
          instance = app(appOptions, mainLogger, models);
          instance.set('modules', modules);

          serverLogger.log(serverLogger.debug, 'setting views path: {0}', serverOptions.viewsPath);
          instance.set('views', serverOptions.viewsPath);
          serverLogger.log(serverLogger.debug, 'setting views engine: {0}', serverOptions.viewEngine);
          instance.set('view engine', serverOptions.viewEngine);

          serverLogger.log(serverLogger.debug, 'setting page view: {0}', serverOptions.pageView);
          instance.set('page view', serverOptions.pageView);
          serverLogger.log(serverLogger.debug, 'setting error view: {0}', serverOptions.errorView);
          instance.set('error view', serverOptions.errorView);

          server = http.createServer(instance);
          server.listen(serverOptions.port);
          server.on('error', serverOptions.onError);
          server.on('listening', serverOptions.onListening);
        });
      }
    }

    function onError(error) {
      if (error.syscall !== 'listen') {
        throw error;
      }

      let addr = server.address();
      let bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;

      switch (error.code) {
        case 'EACCES':
          serverLogger.log(serverLogger.error, '{0} requires elevated privileges', bind);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          serverLogger.log(serverLogger.error, '{0} is already in use', bind);
          process.exit(1);
          break;
        default:
          throw error;
      }
    }

    function onListening() {
      let addr = server.address();
      let bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;

      serverLogger.log(serverLogger.info, 'listening on {0}', bind);
    }

    return Verlag;
  })();
})();
