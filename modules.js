;(function() {
  'use strict';

  const debug = require('debug')('verlag:modules');

  let injected = new Map();

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
    let modules = (res.locals.routes.current.page.content || [])
      .filter(section => section.module)
      .map(section => {
        let module = section.module;
        let args = module.args.reduce((map, arg) => map.set(arg.key, arg.value), new Map());
        return {
          module: injected.get(module.name).get(module.action),
          section: section,
          args: args
        };
      });

    modules.push(null);
    (function exec(index) {
      var m = index < modules.length ? modules[index] : null;
      m !== null && debug('%s: injecting module %s#%s', req.id, m.section.module.name, m.section.module.action);
      return m === null
        ? next
        : () => m.module(m.section, m.args, req, res, exec(index + 1));
    })(0)();
  }
})();
