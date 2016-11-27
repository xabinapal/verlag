;(function() {
  'use strict';

  const conditional = require('./conditional');

  const Context = require('./context');

  let injected = new Map();
  let data = module => ({
    data: module,
    module: injected.get(module.name).get(module.action)
  });

  module.exports.create = (name, actions) => {
    let moduleActions = actions.reduce((map, action) => map.set(action.name, action), new Map());
    injected.set(name, moduleActions);
  }

  module.exports.get = module => {
    return injected[module];
  }

  module.exports.list = () => {
    return [...injected.keys()];
  }

  module.exports.inject = (req, res, next) => {
    let logger = req.logger.create('modules');
    let context = new Context(req, res, logger);

    let modules = (req.router.page.modules || [])
      .filter(module => req.router.evaluateConditions(module.conditions))
      .map(data)
      .map(module => context.create(module, null));

    modules = modules.concat(
      (req.router.page.content || [])
        .filter(section => section.modules.length)
        .map(section => section.modules
          .filter(module => req.router.evaluateConditions(module.conditions))
          .map(data)
          .map(module => context.create(module, section)))
        .reduce((a, b) => a.concat(b), []));

    modules.push(null);

    (function exec(index) {
      let ctx = index < modules.length ? modules[index] : null;
      return ctx ? err => err && next(err) || ctx.call(exec(index + 1)) : next;
    })(0)();
  }
})();
