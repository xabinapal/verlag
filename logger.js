;(function() {
  'use strict';

  const extend = require('extend');
  const morgan = require('morgan');
  const morganJson = require('morgan-json');
  const uuid = require('uuid');
  const winston = require('winston');

  const levels = {};

  const request = morganJson({
    remoteAddr: ':remote-addr',
    remoteUser: ':remote-user',
    date: ':date[clf]',
    method: ':method',
    url: ':url',
    httpVersion: ':http-version',
    status: ':status',
    resultLength: ':res[content-length]',
    referrer: ':referrer',
    userAgent: ':user-agent',
    responseTime: ':response-time'
  });

  class Logger {
    constructor(settings) {
      this._id = settings.id;
      if (this._id === true || !this._id) {
        this._id = uuid.v4();
      }

      this._name = settings.name;
      this._providers = settings.providers;
      this._parent = settings.parent;
      this._children = new Map();

      this._access = settings.access;
      this._write = settings.write;
    }

    get name() {
      let names = [];
      let parent = this;
      while (parent) {
        names.push(parent._name);
        parent = parent._parent;
      }

      names.reverse();
      return names.join(':');
    }

    get requestLogger() {
      return morgan(request, { immediate: true, stream: { write: this._write } });
    }

    get responseLogger() {
      return morgan(request, { stream: { write: this._write } });
    }

    create(name, id) {
      let logger = this._children.get(name);
      
      if (!logger) {
        logger = new Logger({
          name,
          id: id || this.id,
          providers: this._providers,
          parent: this._parent,
          access: this._access,
          write: this._write
        });

        this._children.set(name, logger);
      }

      return logger;
    }

    log(level, message, ...parameters) {
      if (!level in Object.keys(levels).map(x => levels[x])) {
        throw new Error();
      }

      while (/\{(\d+)\}/.test(message)) {
        message = message.replace(/\{(\d+)\}/, function(match, p1) {
          let index = parseInt(p1);
          return parameters.length > index ? parameters[index] : match;
        });
      }

      let log = { id: this._id, module: this._name, message };
      this._access[level.toString().slice(7, -1)](log);
    }
  }

  ['silly', 'debug', 'verbose', 'info', 'warn', 'error'].forEach(x => {
    levels[x] = Symbol(x);
    Logger[x] = levels[x];
    Logger.prototype[x] = levels[x];
  });

  module.exports = logs => {
    const settings = {
      json: false,
      colorize: false,
      handleExceptions: true,
      humanReadableUnhandledException: false
    }

    let providers = logs.providers.map(provider => {
      let providerSettings = {};
      extend(true, providerSettings, settings);
      extend(true, providerSettings, provider);
      delete providerSettings.transport;
 
      return new winston.transports[provider.transport](providerSettings);
    });

    let access = new winston.Logger({
      transports: providers,
      exitOnError: false
    });

    let write = (message) => access.info(JSON.parse(message));

    return new Logger({
      name: settings.name,
      providers,
      access,
      write
    });
  };
})();
