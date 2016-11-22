;(function() {
  'use strict';

  module.exports = (file) => {
    const morgan = require('morgan');
    const uuid = require('uuid');
    const winston = require('winston');

    let transports = [];
    file && transports.push(
      new winston.transports.File({
        level: 'info',
        filename: file,
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false
      }));

    transports.push(
      new winston.transports.Console({
        level: 'debug',
        handleExceptions: true,
        json: true,
        colorize: true
      }));

    const access = new winston.Logger({ transports, exitOnError: false });
    const stream = {
      write(message) {
        access.info(message);
      }
    }

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

        winston[level.toString().slice(7, -1)](JSON.stringify({
          id: this.id,
          module: this.name,
          message
        }));
      }
    }

    const levels = {
      silly: Symbol('silly'),
      debug: Symbol('debug'),
      verbose: Symbol('verbose'),
      info: Symbol('info'),
      warn: Symbol('warn'),
      error: Symbol('error')
    };

    Object.keys(levels).forEach(x => {
      Logger[x] = levels[x];
      Logger.prototype[x] = levels[x];
    });

    Logger.requestLogger = morgan(
      '{"remote_addr": ":remote-addr", "remote_user": ":remote-user", "date": ":date[clf]", "method": ":method", "url": ":url", "http_version": ":http-version", "status": ":status", "result_length": ":res[content-length]", "referrer": ":referrer", "user_agent": ":user-agent", "response_time": ":response-time"}',
      { immediate: true, stream });

    Logger.responseLogger = morgan(
      '{"remote_addr": ":remote-addr", "remote_user": ":remote-user", "date": ":date[clf]", "method": ":method", "url": ":url", "http_version": ":http-version", "status": ":status", "result_length": ":res[content-length]", "referrer": ":referrer", "user_agent": ":user-agent", "response_time": ":response-time"}',
      { stream });

    return Logger;
  };
})();