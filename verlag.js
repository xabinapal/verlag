;(function() {
  'use strict';

  var debug = require('debug')('verlag:server');
  var path = require('path');
  var uuid = require('uuid');

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
    var id, server, instance;

    var serverOptions, appOptions;
    var extraModules;

    function verlag(options) {
      app = require('./app');
      http = require('http');
      mongoose = require('mongoose');

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
      id = uuid.v4();
      debug('%s: starting server...', id);
      var modules = require('./modules');
      var models = Object.create(null);

      debug('%s: opening database connection...', id);
      mongoose.connect(serverOptions.databaseConnection);
      var db = mongoose.connection;

      db.on('error', () => debug('%s: error opening database connection', id));
      db.once('open', function() {
        debug('%s: database connection opened', id);
        ['menu', 'page', 'category', 'publication'].forEach(function(model) {
          models[model] = require('./models/' + model)(mongoose);
        });

        ['markdown', 'menu', 'contact', 'catalog'].forEach(module => {
          var m = path.join(__dirname, 'verlag_modules', module);
          require(m)(modules);
        });

        instance = app(appOptions, modules, models);
        instance.set('views', serverOptions.viewsPath);
        debug('%s: setting views path: %s', id, serverOptions.viewsPath);
        instance.set('view engine', serverOptions.viewEngine);
        debug('%s: setting view engine: %s', id, serverOptions.viewEngine);

        instance.set('page view', serverOptions.pageView);
        debug('%s: setting page view: %s', id, serverOptions.pageView);
        instance.set('error view', serverOptions.errorView);
        debug('%s: setting error view: %s', id, serverOptions.errorView);

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
          debug('%s: %s requires elevated privileges', id, bind);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          debug('%s: %s is already in use', id, bind);
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

      debug('%s: listening on ' + bind, id);
    }

    return verlag;
  })();
})();
