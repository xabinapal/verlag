;(function() {
  'use strict';

  var debug = require('debug')('verlag:server');
  var path = require('path');

  module.exports = (function() {
    var serverDefaults = {
      port: 3000,
      onError: onError,
      onListening: onListening,
      databaseConnection: 'mongodb://localhost/verlag',

      viewsPath: undefined,
      viewEngine: 'pug',

      pageView: 'page',
      errorView: 'error'
    };

    var appDefaults = {
      appTitle: 'verlag',
    };

    var app, http, mongoose;
    var server, instance;

    var serverOptions, appOptions;
    var extraModules;

    function verlag(options) {
      http = require('http');
      mongoose = require('mongoose');

      app = require('./app');

      mongoose.Promise = global.Promise;

      serverOptions = Object.assign({}, serverDefaults);
      appOptions = Object.assign({}, appDefaults);
    }

    verlag.prototype.setServerOptions = function(opts) {
      Object.assign(serverOptions, opts);
    }

    verlag.prototype.setAppOptions = function(opts) {
      Object.assign(appOptions, opts);
    }

    verlag.prototype.startServer = function() {
      debug('starting server...');
      var modules = require('./modules');
      var models = Object.create(null);

      debug('opening database connection...');
      mongoose.connect(serverOptions.databaseConnection);
      var db = mongoose.connection;

      db.on('error', () => debug('error opening database connection'));
      db.once('open', function() {
        debug('database connection opened');
        ['menu', 'page', 'category', 'publication'].forEach(function(model) {
          models[model] = require('./models/' + model)(mongoose);
        });

        ['markdown', 'menu', 'contact', 'catalog'].forEach(module => {
          var m = path.join(__dirname, 'verlag_modules', module);
          require(m)(modules);
        });

        instance = app(appOptions, modules, models);
        instance.set('views', serverOptions.viewsPath);
        debug('setting views path: %s', serverOptions.viewsPath);
        instance.set('view engine', serverOptions.viewEngine);
        debug('setting view engine: %s', serverOptions.viewEngine);

        instance.set('page view', serverOptions.pageView);
        debug('setting page view: %s', serverOptions.pageView);
        instance.set('error view', serverOptions.errorView);
        debug('setting error view: %s', serverOptions.errorView);

        server = http.createServer(instance);
        server.listen(serverOptions.port);
        server.on('error', serverOptions.onError);
        server.on('listening', serverOptions.onListening);
      });
    }

    function onError(error) {
      if (error.syscall !== 'listen') {
        throw error;
      }

      var addr = server.address();
      var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;

      switch (error.code) {
        case 'EACCES':
          debug(bind + ' requires elevated privileges');
          process.exit(1);
          break;
        case 'EADDRINUSE':
          debug(bind + ' is already in use');
          process.exit(1);
          break;
        default:
          throw error;
      }
    }

    function onListening() {
      var addr = server.address();
      var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;

      debug('listening on ' + bind);
    }

    return verlag;
  })();
})();
