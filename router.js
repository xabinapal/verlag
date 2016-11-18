;(function() {
  'use strict';

  var debug = require('debug')('verlag:router');

  var pathToRegexp = require('path-to-regexp');
  var conditional = require('./conditional');

  function Router(page) {
    if (!(this instanceof Router)) {
      return new Router(page);
    }

    this.page = page;

    this.basePath = Router.getBasePath(page);
    this.fullPath = Router.getFullPath(page, this.basePath);

    this.keys = [];
    this.regexp = pathToRegexp(this.fullPath, this.keys);
    this.reverse = pathToRegexp.compile(this.fullPath);
  }

  Router.getBasePath = function(page) {
    var path = page.basePath || '/';
    path[0] != '/' && (path = '/' + path);
    path = path.replace(/([^\/])\/+$/g, '$1');
    return path;
  }

  Router.getFullPath = function(page, path) {
    page.path && page.path
      .slice()
      .sort((a, b) => a.position - b.position)
      .forEach(function(key) {
        path += key.parameter ? '/:' + key.key : '(/' + key.key + ')';
        key.optional && (path += '?');
      });

    path.endsWith('/') && (path = path.slice(0, -1));
    return path;
  }

  Router.prototype.match = function(req) {
    if (req.path === undefined || req.path === null) {
      this.id = undefined;
      this.path = undefined;
      this.parameters = undefined;
      this.optionalPath = undefined;
      return false;
    }

    var match = this.regexp.exec(req.path);
    if (!match) {
      this.id = undefined;
      this.path = undefined;
      this.parameters = undefined;
      this.optionalPath = undefined;
      return false;
    }

    this.id = req.id;
    this.path = match[0];
    this.parameters = {};
    this.optionalPath = {}

    match = match.slice(1);
    for (var i = 0; i < match.length; i++) {
      let key = this.keys[i];
      if (key.prefix === '/') {
        this.parameters[key.name] = match[i];
      } else {
        this.optionalPath[key.name] = match[i];
      }
    }

    debug('%s: match found: %s', req.id, this.fullPath);
    return true;
  }

  Router.prototype.getParameterKey = function(type) {
    var param = this.page.parameters.find(x => x.type === type);
    return param.key;
  }

  Router.prototype.getParameterValue = function(key) {
    return key && this.parameters[key] || undefined;
  }

  Router.prototype.hasParameter = function(key) {
    return this.getParameterValue(key) !== undefined;
  }

  Router.prototype.isOptionalPathSet = function(key) {
    return this.optionalPath[key] !== undefined;
  }

  Router.prototype.evaluateCondition = function(condition) {
    return conditional(this, condition);
  }

  Router.prototype.create = function(parameters) {
    try {
      let params = parameters
        .reduce((dict, val) => (dict[val.key] = val.value) && dict, {});

      var route = this.reverse(params);
      debug('%s: created route %s from %s', this.id, route, this.fullPath);
      return route;
    } catch (err) {
      debug('%s: can\'t create route from %s with parameters %s', this.id, this.fullPath, parameters);
      return null;
    }
  }

  module.exports = Router;
})();
