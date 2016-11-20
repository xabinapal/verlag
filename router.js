'use strict';

const debug = require('debug')('verlag:router');

const pathToRegexp = require('path-to-regexp');
const conditional = require('./conditional');

class Router {
  constructor(page) {
    this.page = page;

    this.keys = [];
    this.regexp = pathToRegexp(this.fullPath, this.keys);
    this.reverse = pathToRegexp.compile(this.fullPath);
  }

  get basePath() {
    if (this._basePath !== undefined) {
      return this._basePath;
    }

    this._basePath = this.page.basePath || '/';
    this._basePath[0] != '/' && (this._basePath = '/' + this._basePath);
    this._basePath = this._basePath.replace(/([^\/])\/+$/g, '$1');
    return this._basePath;
  }

  get fullPath() {
    if (this._fullPath !== undefined) {
      return this._fullPath;
    }

    this._fullPath = this.basePath;
    this.page.path && this.page.path
      .slice()
      .sort((a, b) => a.position - b.position)
        .forEach(key => {
        this._fullPath += key.parameter ? '/:' + key.key : '(/' + key.key + ')';
        key.optional && (this._fullPath += '?');
      });

    this._fullPath = this._fullPath.replace(/\/+$/, '');
    return this._fullPath;
  }

  match(req) {
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
    this.parameters = new Map();
    this.optionalPath = new Map();

    match = match.slice(1);
    for (var i = 0; i < match.length; i++) {
      let key = this.keys[i];
      if (key.prefix === '/') {
        this.parameters.set(key.name.toString(), match[i]);
      } else {
        this.optionalPath.set(key.name.toString(), match[i]);
      }
    }

    debug('%s: match found: %s', req.id, this.fullPath);
    return true;
  }

  create(parameters) {
    let params = parameters.reduce((obj, val) => (obj[val.key] = val.value) && obj, Object.create(null));

    try {
      let route = this.reverse(params);
      debug('%s: created route %s from %s', this.id, route, this.fullPath);
      return route;
    } catch (err) {
      debug('%s: can\'t create route from %s with parameters %s', this.id, this.fullPath, parameters);
      return null;
    }
  }

  getParameter(key) {
    return key && this.parameters.get(key) || undefined;
  }

  hasParameter(key) {
    return this.hasParameter(key) !== undefined;
  }

  evaluateCondition(condition) {
    return conditional(this, condition);
  }

  isOptionalPathSet(key) {
    return key && this.optionalPath.get(key) !== undefined;
  }
}

module.exports = Router;
