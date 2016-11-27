;(function() {
  'use strict';

  class Context {
    constructor(req, res) {
      this.req = req;
      this.res = res;
    }

    call(module, logger, next) {
      this.logger = logger.create(module.name);
      this.next = next;
      return module.module(module.section, module.args, this);
    }

    get view() {
      return this.req.app.get('view getter');
    }

    get models() {
      return this.req.models;
    }

    get current() {
      return this.res.locals.routes.current;
    }

    get body() {
      return this.req.body;
    }

    get locals() {
      return this.res.locals;
    }
  }

  module.exports = Context;
})();
