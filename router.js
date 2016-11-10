;(function() {
  'use strict';

  var pathToRegexp = require('path-to-regexp');

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
    var path = page.path || '/';
    path[0] != '/' && (path = '/' + path);
    path = path.replace(/([^\/])\/+$/g, '$1');
    return path;
  }

  Router.getFullPath = function(page, path) {
    page.parameters && page.parameters.forEach(function(parameter) {
      path += '/:' + parameter.key;
      parameter.optional && (path += '?');
    });

    path.endsWith('/') && (path = path.slice(0, -1));
    return path;
  }

  Router.prototype.match = function(path) {
    if (path === undefined || path === null) {
      this.path = undefined;
      this.params = undefined;
      return false;
    }

    var match = this.regexp.exec(path);
    if (!match) {
      this.path = undefined;
      this.params = undefined;
      return false;
    }

    this.path = match[0];
    this.params = {};

    for (var i = 1; i < match.length; match++) {
      var key = this.keys[i - 1];
      this.params[key.name] = match[i];
    }

    return true;
  }

  Router.prototype.getParamKey = function(type) {
    var param = this.page.parameters.find(x => x.type === type);
    return param.key;
  }

  Router.prototype.getParamVal = function(type) {
    var param = this.getParamKey(type);
    return param && this.params[param] || undefined;
  }

  Router.prototype.create = function(parameters) {
    var params = parameters
      .map(x => ({ key: this.getParamKey(x.type), value: x.value }))
      .reduce((dict, val) => (dict[val.key] = val.value) && dict, {});

    try {
      var route = this.reverse(params);
      return route;
    } catch (err) {
      return null;
    }
  }

  module.exports = Router;
})();
