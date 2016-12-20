;(function() {
  'use strict';

  const extend = require('extend');
  const fs = require('fs');
  const http = require('http');
  const mongoose = require('mongoose');
  const path = require('path');

  const app = require('./app');
  const logger = require('./logger');

  const _models = ['menu', 'page', 'category', 'publication'];
  const _extensions = ['page', 'markdown', 'form', 'mailer', 'catalog'];

  let settings = {
    port: undefined,
    sock: undefined,
    permissions: undefined,
    database: 'mongodb://localhost/verlag',

    views: {
      engine: undefined,
      path: undefined,
      page: undefined,
      error: {
        default: undefined
      }
    },

    logs: {
      name: 'verlag',
      providers: [
        {
          transport: 'Console',
          level: 'debug',
          colorize: true,
          humanReadableUnhandledException: true
        }
      ]
    }
  };

  let locals = {
    appTitle: 'verlag',
    staticPath: 'static/'
  };

  mongoose.promise = global.Promise; 

  module.exports = class Verlag {
    constructor() {
      this._onListening = () => {
        let addr = this.server.address();
        let bind = typeof addr === 'string'
          ? 'pipe ' + addr
          : 'port ' + addr.port;

        this.serverLogger && this.serverLogger.log(this.serverLogger.info, 'listening on {0}', bind);
      };

      this._onError = error => {
        if (error.syscall !== 'listen') {
          throw error;
        }

        let addr = this.server.address();
        let bind = typeof addr === 'string'
          ? 'pipe ' + addr
          : 'port ' + addr.port;

        switch (error.code) {
          case 'EACCES':
            this.serverLogger && this.serverLogger.log(this.serverLogger.error, '{0} requires elevated privileges', bind);
            process.exit(1);
            break;

          case 'EADDRINUSE':
            this.serverLogger && this.serverLogger.log(this.serverLogger.error, '{0} is already in use', bind);
            process.exit(1);
            break;

          default:
            throw error;
        }
      };
    }

    set settings(opts) {
      this._settings = {};
      extend(true, this._settings, settings);
      extend(true, this._settings, opts);
    }

    set locals(opts) {
      this._locals = {};
      extend(true, this._locals, locals);
      extend(true, this._locals, opts);
    }

    set onListening(func) {
      this._onListening = func;
    }

    set onError(func) {
      this._onError = func;
    }

    start() {
      let mainLogger = logger(this._settings.logs);
      this.serverLogger = mainLogger.create('server');
      this.serverLogger.log(this.serverLogger.info, 'starting server...');

      this.serverLogger.log(this.serverLogger.debug, 'opening database connection...');
      mongoose.connect(this._settings.database);

      const db = mongoose.connection;
      db.on('error', () => this.serverLogger.log(this.serverLogger.error, 'error opening database connection'));
      db.once('open', () => {
        this.serverLogger.log(this.serverLogger.debug, 'database connection opened');
        
        let models = Object.create(null);
        _models.forEach(function(model) {
          let m = path.join(__dirname, 'models', model);
          models[model] = require(m)(mongoose);
        });

        let extensions = _extensions.map(m => require(path.join(__dirname, 'extensions', m)));

        this.instance = app();
        this.instance.set('locals', this._locals);
        this.instance.set('views', this._settings.views);
        this.instance.set('view engine', this._settings.views.engine);
        this.instance.set('logger', mainLogger.create('app', true));
        this.instance.set('models', models);
        this.instance.set('extensions', extensions);

        this.server = http.createServer(this.instance);

        this.server.on('error', this._onError);
        this.server.on('listening', this._onListening);
        
        if (this._settings.port) {
          this.serverLogger.log(this.serverLogger.debug, 'binding server to port {0}', this._settings.port);
          this.server.listen(this._settings.port);
        } else if (this._settings.sock) {
          this.serverLogger.log(this.serverLogger.debug, 'binding server to domain socket {0}', this._settings.sock);

          fs.unlink(this._settings.sock, () => {
            this.server.listen(this._settings.sock, () => {
              if (this._settings.permissions) {
                this.serverLogger.log(this.serverLogger.debug, 'setting domain socket permissions to {0}', this._settings.permissions);
                fs.chmodSync(this._settings.sock, this._settings.permissions);
              }


            });
          });
        } else {
          // TODO: throw error
        }
      });
    }
  };
})();
