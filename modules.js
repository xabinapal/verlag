;(function() {
  'use strict';

  const conditional = require('./conditional');
  const context = require('./context');

  class Module {
    constructor() {
      this._constructor();
    }

    get name() {
      return this.constructor.name;
    }

    get actions() {
      let proto = Object.getPrototypeOf(this);
      return Object.getOwnPropertyNames(proto)
        .filter(action => action !== '_constructor')
        .map(action => this[action])
        .filter(action => action instanceof Function && action !== this);
    }
  }
  
  [...context.types.values()]
    .forEach(ctx => Module[ctx.name] = ctx.value);

  let moduleFactory = obj => {
    let module = new (obj(Module));
    let actions = [...context.types.values()]
      .map(context => [
        context.value,
        new Map(module.actions
          .filter(action => action.context & context.value)
          .map(action => [action.name, action]))]);

    return [module.constructor.name, new Map(actions)];
  };

  class ModuleCollection extends Map {
    constructor(modules) {
      super((modules || []).map(moduleFactory));
    }

    inject(req, res, next) {
      this.logger = req.logger.create('modules');
      let ctx = context(req, res, this.logger);

      let modules = (req.current.page.modules || [])
        .filter(module => !module.postExecute)
        .filter(module => req.current.evaluateConditions(module.conditions))
        .map(module => this.parser(Module.ROUTER, module))
        .map(module => new ctx.RouterContext(module));

      modules = modules.concat(
        (req.current.page.content || [])
          .filter(section => section.modules.length)
          .map(section => section.modules
            .filter(module => req.current.evaluateConditions(module.conditions))
            .map(module => this.parser(Module.SECTION, module))
            .map(module => new ctx.SectionContext(module, section)))
          .reduce((a, b) => a.concat(b), []));

      modules.concat(
        (req.current.page.modules || [])
          .filter(module => module.postExecute)
          .filter(module => req.current.evaluateConditions(module.conditions))
          .map(module => this.parser(Module.ROUTER, module))
          .map(module => new ctx.RouterContext(module)));

      modules.push(null);

      (function exec(index) {
        let ctx = index < modules.length ? modules[index] : null;
        return ctx ? err => err && next(err) || ctx.call(exec(index + 1)) : next;
      })(0)();
    }

    parser(context, data) {
      let module = super.get(data.name);
      if (!module) {
        this.logger.log(_logger.error, 'module {0} does not exist', data.name);
      }

      let action = module && module.get(context).get(data.action);
      if (!action) {
        this.logger.log(_logger.error, 'module {0} action {1}.{2} does not exist', data.name, data.action);
      }

      return {
        data: data,
        action: action
      }
    }
  }

  module.exports.Module = Module;
  module.exports.ModuleCollection = ModuleCollection;
})();
