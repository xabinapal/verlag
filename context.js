;(function() {
  'use strict';

  const pug = require('pug'); 
  const contexts = ['ROUTER', 'SECTION']
    .map((ctx, index) => ({
      name: ctx,
      value: 1 << index,
      display: ctx.toLowerCase()
    })).reduce((dict, ctx) => dict.set(ctx.name, ctx), new Map());

  let findContextByValue = val => [...contexts.entries()].find(x => x[1].value === val)[1];

  let _req, _res, _logger;

  class Context {
    constructor(extension) {
      this.name = extension.data.name;
      this.action = extension.data.action;
      this.exec = extension.action;

      this.args = extension.data.args.reduce((map, arg) => map.set(arg.key, arg.value), new Map());
      this.logger = _logger.create(extension.data.name).create(extension.data.action);
    }

    call(next) {
      _logger.log(_logger.debug, 'injecting {0} extension {1}.{2}', findContextByValue(this.type).display, this.name, this.action);

      this.next = next;
      return this.exec(this);
    }

    arg(arg) {
      return this.args.get(arg);
    }

    set(prop, arg) {
      if (!_res.locals.extensions) {
        _res.locals.extensions = new Map();
      }

      if (!_res.locals.extensions.has(this.name)) {
        _res.locals.extensions.set(this.name, new Map());
      }

      _res.locals.extensions.get(this.name).set(prop, arg);
    }

    err() {
      console.log(arguments);
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
  }

  [...contexts.values()]
    .forEach(ctx => Context[ctx.name] = Context.prototype[ctx.name] = ctx.value);

  class RouterContext extends Context {
    constructor(module) {
      super(module);
      this.type = Context.ROUTER;
    }
  }

  RouterContext.context = Context.ROUTER;
  RouterContext.prototype.type = contexts.get('ROUTER');

  class SectionContext extends Context {
    constructor(module, section) {
      super(module);
      this.type = Context.SECTION;
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

  SectionContext.context = Context.SECTION;
  SectionContext.prototype.type = contexts.get('SECTION');

  module.exports = (req, res, logger) => {
    _req = req;
    _res = res;
    _logger = logger;

    return [RouterContext, SectionContext]
      .reduce((map, ctx) => map.set(ctx.context, ctx), new Map());
  };

  module.exports.types = contexts;
})();
