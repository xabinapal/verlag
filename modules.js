;(function() {
  'use strict';

  const conditional = require('./conditional');
  const context = require('./context');

  const contexts = ['ROUTER', 'SECTION'];

  class Module {
    get name() {
      return this.constructor.name;
    }

    actions() {
      let proto = Object.getPropertyOf(this);
      return Object.getOwnPropertyNames(proto)
        .filter(action => method instanceof Function && method !== this)
        .map(action = this[action]);
    }
  }

  contexts.forEach((context, index) => Module[context] = 1 << index);

  let moduleFactory = obj => {
    let module = obj(Module);
    let actions = contexts.forEach(context => [
        context,
        obj.actions
          .filter(action => action.context & context)
          .map(action => [action.name, action])]);
    return [module, new Map(actions)];
  }

  class ModuleCollection extends Map {
    constructor(...modules) {
      super(modules.map(moduleFactory));
    }

    inject(req, res, next) {
      let logger = req.logger.create('modules');
      let ctx = context(req, res, logger);

      let modules = (req.current.page.modules || [])
        .filter(module => req.current.evaluateConditions(module.conditions))
        .map(data)
        .map(module => new ctx.Context(module));

      modules = modules.concat(
        (req.current.page.content || [])
          .filter(section => section.modules.length)
          .map(section => section.modules
            .filter(module => req.current.evaluateConditions(module.conditions))
            .map(module => ({
              data: module,
              module: this.get(module.name).get(module.action)
            })).map(module => new ctx.SectionContext(module, section)))
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
