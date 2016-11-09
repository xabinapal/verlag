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
  }

  Router.getBasePath = function(page) {
    var path = page.path || '/';
    path[0] != '/' && (path = '/' + path);
    path = path.replace(/([^\/])\/+$/g, '$1');
    return path;
  }

  Router.getFullPath = function(page, path) {
    var params = page.parameters;
    params && params.forEach(function(parameter) {
      path += '/:' + parameter.name;
      if (parameter.optional) {
        path += '?';
      }
    });

    if (path.endsWith('/')) {
      path = path.slice(0, -1);
    }

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

  Router.prototype.parameter = function(type) {
    console.log(type);
    console.log(this.page.parameters);
    console.log(this.path);
    console.log(this.params);
    var param = this.page.parameters.find(x => x.type === type);
    if (!param) {
      return undefined;
    }

    return this.params[param];
  }

  Router.prototype.create = function(parameters) {
    return '/';
  }

  module.exports = Router;
})();
