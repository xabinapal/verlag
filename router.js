;(function() {
  'use strict';

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
      this._basePath[0] != '/' && (this._basePath = `/${this._basePath}`);
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
          this._fullPath += key.parameter ? `/:${key.key}` : `(/${key.key})`;
          key.optional && (this._fullPath += '?');
        });

      this._fullPath = this._fullPath.replace(/\/+$/, '');
      return this._fullPath;
    }

    match(req) {
      this.logger = req.logger.create('router');

      if (req.path === undefined || req.path === null) {
        this.path = undefined;
        this.parameters = undefined;
        this.optionalPath = undefined;
        return false;
      }

      let match = this.regexp.exec(req.path);
      if (!match) {
        this.path = undefined;
        this.parameters = undefined;
        this.optionalPath = undefined;
        return false;
      }

      this.path = match[0];
      this.parameters = new Map();
      this.optionalPath = new Map();

      match = match.slice(1);
      for (let i = 0; i < match.length; i++) {
        let key = this.keys[i];
        if (key.prefix === '/') {
          this.parameters.set(key.name.toString(), match[i]);
        } else {
          this.optionalPath.set(key.name.toString(), match[i]);
        }
      }

      this.logger.log(this.logger.info, 'match found: {0}', this.fullPath);
      return true;
    }

    create(parameters) {
      let params = parameters.reduce((obj, val) => (obj[val.key] = val.value) && obj, Object.create(null));

      try {
        let route = this.reverse(params);
        this.logger.log(this.logger.debug, 'created route {0} from {1}', route, this.fullPath);
        return route;
      } catch (err) {
        this.logger.log(this.logger.warn, 'can\'t create route from {0} with parameters {1}', this.fullPath, parameters);
        return null;
      }
    }

    getParameter(key) {
      return key && this.parameters.get(key) || undefined;
    }

    hasParameter(key) {
      return this.hasParameter(key) !== undefined;
    }

    evaluateConditions(conditions) {
      return (conditions || []).every(x => conditional(this, x));
    }

    isOptionalPathSet(key) {
      return key && this.optionalPath.get(key) !== undefined;
    }
  }

  class RouterCollection extends Array {
    constructor(req, routers) {
      super(...routers.map(x => new Router(x)));
      this._current = this.find(x => x.match(req));
    }

    get current() {
      return this._current;
    }

    findByBasePath(basePath) {
      return this.find(page => page.basePath === basePath);
    }
  }

  module.exports.Router = Router;
  module.exports.RouterCollection = RouterCollection;
})();
