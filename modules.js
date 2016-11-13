;(function() {
  'use strict';

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
          section: section,
          args: args,
          module: injected[module.name][module.action]
        };
      });

    modules.push(null);
    (function exec(index) {
      var m = index >= 0 &&  index < modules.length ? modules[index] : null;
      return m === null
        ? next
        : () => m.module(m.section, m.args, req, res, exec(index + 1));
    })(0)();
  }
})();
