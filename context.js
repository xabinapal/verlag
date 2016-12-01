;(function() {
  'use strict';

  const pug = require('pug');

  let _req, _res, _logger;

  class Context {
    constructor(module, section = null) {
      this.module = module.module;
      this.name = module.data.name;
      this.action = module.data.action;
      this.section = section;
      this.type = section ? 'section' : 'page';

      this.args = module.data.args.reduce((map, arg) => map.set(arg.key, arg.value), new Map());
      this.logger = _logger.create(module.data.name).create(module.data.action);
    }

    call(next) {
      this.next = next;
      _logger.log(_logger.debug, 'injecting {0} module {1}.{2}', this.type, this.name, this.action);
      return this.module(this);
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

  class SectionContext extends Context {
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
    return { Context, SectionContext };
  };
})();
