;(function() {
  'use strict';

  let _logger = null;

  class Context {
    constructor(req, res, logger) {
      this.req = req;
      this.res = res;
      _logger = _logger || logger;
    }

    create(module, section) {
      let ctx = new Context(this.req, this.res);

      ctx.module = module.module;
      ctx.name = module.data.name;
      ctx.action = module.data.action;
      ctx.section = section;
      ctx.type = section ? 'section' : 'page';

      ctx.args = module.data.args.reduce((map, arg) => map.set(arg.key, arg.value), new Map());
      ctx.logger = _logger.create(module.data.name).create(module.data.action);

      return ctx;
    }

    call(next) {
      this.next = next;
      _logger.log(_logger.debug, 'injecting {0} module {1}.{2}', this.type, this.name, this.action);
      return this.module(this);
    }

    get view() {
      return this.req.app.get('view getter')(this.args.get('view'));
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

    arg(arg) {
      return this.args.get(arg);
    }
  }

  module.exports = Context;
})();
