;(function() {
  'use strict';

  module.exports = (file) => {
    const morgan = require('morgan');
    const morganJson = require('morgan-json');
    const uuid = require('uuid');
    const winston = require('winston');

    let transports = [];
    file && transports.push(
      new winston.transports.File({
        level: 'info',
        filename: file,
        handleExceptions: true,
        json: true,
        maxsize: 5242880,
        maxFiles: 5,
        colorize: false
      }));

    transports.push(
      new winston.transports.Console({
        level: 'debug',
        handleExceptions: true,
        json: false,
        colorize: true
      }));

    const access = new winston.Logger({ transports, exitOnError: false });
    const write = (message) => access.info(JSON.parse(message));

    const levels = {};
    
    class Logger {
      constructor(name, id) {
        this._name = name;

        this.id = id === true || !id ? uuid.v4() : id;
        this.parent = undefined;
        this.children = new Map();
      }

      get name() {
        let names = [];
        let parent = this;
        while (parent) {
          names.push(parent._name);
          parent = parent.parent;
        }

        names.reverse();
        return names.join(':');
      }

      create(name, id) {
        let logger = this.children.get(name);
        
        if (!logger) {
          logger = new Logger(name, id || this.id);
          this.children.set(name, logger);
          logger.parent = this;
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

        let log = { id: this.id, module: this.name, message };
        access[level.toString().slice(7, -1)](log);
      }
    }

    ['silly', 'debug', 'verbose', 'info', 'warn', 'error'].forEach(x => {
      levels[x] = Symbol(x);
      Logger[x] = levels[x];
      Logger.prototype[x] = levels[x];
    });

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

    Logger.requestLogger = morgan(request, { immediate: true, stream: { write } });
    Logger.prototype.requestLogger = Logger.requestLogger;

    Logger.responseLogger = morgan(request, { stream: { write } });
    Logger.prototype.responseLogger = Logger.responseLogger;

    return Logger;
  };
})();
