;(function() {
  'use strict';

  const pug = require('pug'); 
  const contexts = ['ROUTER', 'SECTION']
    .map((ctx, index) => ({
      name: ctx,
      value: 1 << index,
      display: ctx.toLowerCase()
    })).reduce((dict, ctx) => dict.set(ctx.name, ctx), new Map());

  let _req, _res, _logger;

  class Context {
    constructor(module) {
      this.name = module.data.name;
      this.action = module.data.action;
      this.exec = module.action;

      this.args = module.data.args.reduce((map, arg) => map.set(arg.key, arg.value), new Map());
      this.logger = _logger.create(module.data.name).create(module.data.action);
    }

    call(next) {
      _logger.log(_logger.debug, 'injecting {0} module {1}.{2}', this.type.display, this.name, this.action);

      this.next = next;
      return this.exec(this);
    }

    get view() {
      return _req.app.get('view getter')(this.args.get('view'));
    }

    get models() {
      return _req.models;
    }

    get routers() {
      return _res.locals.routers;
    }

    get menus() {
      return _res.locals.menus;
    }

    get body() {
      return _req.body;
    }

    get locals() {
      return _res.locals;
    }

    arg(arg) {
      return this.args.get(arg);
    }

    set(prop, arg) {
      res.locals.modules.get(this.name).set(prop, arg);
    }
  }

  [...contexts.values()]
    .forEach(ctx => Context[ctx.name] = ctx.value);

  class RouterContext extends Context {
    constructor(module) {
      super(module);
      this.type = contexts.get('ROUTER');
    }
  }

  class SectionContext extends Context {
    constructor(module, section) {
      super(module);
      this.type = contexts.get('SECTION');
      this.section = section;
    }

    get content() {
      return section.content;
    }

    set content(val) {
      this.section.content = val;
    }

    render(locals) {
      _logger.log(_logger.silly, 'rendering view {0} requested by module {1}.{2}', this.args.get('view'), this.name, this.action);
      let view = this.view;
      locals = Object.assign({}, _res.locals, locals);
      return pug.renderFile(view, locals);
    }
  }

  module.exports = (req, res, logger) => {
    _req = req;
    _res = res;
    _logger = logger;
    return { RouterContext, SectionContext };
  };

  module.exports.types = contexts;
})();
