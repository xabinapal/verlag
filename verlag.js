;(function() {
  'use strict';

  var debug = require('debug')('verlag:server');

  module.exports = (function(options) {
    var app, http, mongoose;
    var server;

    var serverDefaults = {
      port: 3000,
      onError: onError,
      onListening: onListening,
      databaseConnection: 'mongodb://localhost/verlag'
    };

    var appDefaults = {
      appTitle: 'verlag',
    };

    var serverOptions, appOptions;

    function verlag(options) {
      app = require('./app');
      http = require('http');
      mongoose = require('mongoose');

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
      mongoose.Promise = global.Promise;
      mongoose.connect(serverOptions.databaseConnection);

      var db = mongoose.connection;
      var models = Object.create(null);

      db.on('error', console.error.bind(console, 'connection error:'));
      db.once('open', function() {
        ['menu', 'page', 'category', 'publication'].forEach(function(model) {
          models[model] = require('./models/' + model)(mongoose);
        });

        var instance = app(appOptions, models);
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

      /*var bind = typeof addr === 'string'
        ? 'Pipe ' + addr
        : 'Port ' + addr.port;*/

      // handle specific listen errors with friendly messages
      switch (error.code) {
        case 'EACCES':
          //console.error(bind + ' requires elevated privileges');
          process.exit(1);
          break;
        case 'EADDRINUSE':
          //console.error(bind + ' is already in use');
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

    return new verlag(options);
  })();
})();
