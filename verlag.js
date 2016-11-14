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
      var modules = require('./modules');
      var models = Object.create(null);

      mongoose.connect(serverOptions.databaseConnection);
      var db = mongoose.connection;

      db.on('error', console.error.bind(console, 'connection error:'));
      db.once('open', function() {
        ['menu', 'page', 'category', 'publication'].forEach(function(model) {
          models[model] = require('./models/' + model)(mongoose);
        });

        ['markdown', 'menu', 'contact', 'catalog'].forEach(module => {
          var m = path.join(__dirname, 'verlag_modules', module);
          require(m)(modules);
        });

        instance = app(appOptions, modules, models);
        instance.set('views', serverOptions.viewsPath);
        instance.set('view engine', serverOptions.viewEngine);

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
        ? 'Pipe ' + addr
        : 'Port ' + addr.port;

      switch (error.code) {
        case 'EACCES':
          console.error(bind + ' requires elevated privileges');
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(bind + ' is already in use');
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

      debug('Listening on ' + bind);
    }

    return verlag;
  })();
})();
