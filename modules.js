;(function() {
  'use strict';

  var debug = require('debug')('verlag:modules');

  var injected = {};

  module.exports.create = function(name, actions) {
    injected[name] = actions.reduce((dict, action) => (dict[action.name] = action) && dict, {});
  }

  module.exports.get = function(module) {
    return injected[module];
  }

  module.exports.inject = function(req, res, next) {
    var modules = (res.locals.routes.current.page.content || [])
      .filter(section => section.module)
      .map(section => {
        var module = section.module;
        var args = module.args.reduce((dict, arg) => (dict[arg.key] = arg.value) && dict, {});
        return {
          module: injected[module.name][module.action],
          section: section,
          args: args
        };
      });

    modules.push(null);
    (function exec(index) {
      var m = index >= 0 &&  index < modules.length ? modules[index] : null;
      m !== null && debug('%s: injecting module %s#%s', req.id, m.section.module.name, m.section.module.action);
      return m === null
        ? next
        : () => m.module(m.section, m.args, req, res, exec(index + 1));
    })(0)();
  }
})();
