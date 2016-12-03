;(function() {
  'use strict';

  const conditional = require('./conditional');
  const context = require('./context');

  const contexts = ['ROUTER', 'SECTION'];

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

  contexts.forEach((context, index) => Module[context] = 1 << index);

  let moduleFactory = obj => {
    let module = new (obj(Module));
    let actions = contexts
      .map(context => Module[context])
      .map(context => [
        context,
        new Map(module.actions
          .filter(action => action.context & context)
          .map(action => [action.name, action]))]);

    return [module.constructor.name, new Map(actions)];
  };

  let moduleParser = (map, context, data) => {
    let module = map.get(data.name);
    if (!module) {
      console.log('module adre', context, data);
    }
    let action = module && module.get(context).get(data.action);
    if (!action) {
      console.log(module);
      console.log('action adre', context, data);
    }
    return {
      data: data,
      action: action
    }
  };

  class ModuleCollection extends Map {
    constructor(modules) {
      super((modules || []).map(moduleFactory));
    }

    inject(req, res, next) {
      let logger = req.logger.create('modules');
      let ctx = context(req, res, logger);

      let modules = (req.current.page.modules || [])
        .filter(module => req.current.evaluateConditions(module.conditions))
        .map(module => moduleParser(this, Module.ROUTER, module))
        .map(module => new ctx.Context(module));

      modules = modules.concat(
        (req.current.page.content || [])
          .filter(section => section.modules.length)
          .map(section => section.modules
            .filter(module => req.current.evaluateConditions(module.conditions))
            .map(module => moduleParser(this, Module.SECTION, module))
            .map(module => new ctx.SectionContext(module, section)))
          .reduce((a, b) => a.concat(b), []));

      modules.push(null);

      (function exec(index) {
        let ctx = index < modules.length ? modules[index] : null;
        return ctx ? err => err && next(err) || ctx.call(exec(index + 1)) : next;
      })(0)();
    }
  }

  module.exports.Module = Module;
  module.exports.ModuleCollection = ModuleCollection;
})();
