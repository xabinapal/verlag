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
    (res.locals.routes.current.page.content || [])
      .filter(section => section.module)
      .forEach(section => {
        var module = section.module;
        var args = module.args.reduce((dict, arg) => (dict[arg.key] = arg.value) && dict, {});
        var action = injected[module.name][module.action](section, args, req, res, next);
      });

    next();
  }
})();
