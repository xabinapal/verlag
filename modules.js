;(function() {
  'use strict';

  function Module(actions) {
    if (!(this instanceof Module)) {
      return new Module(actions);
    }

    this.actions = (actions.constructor === Object) ? actions : null;
  }

  Module.prototype.exec = function(action, args) {
    return 
  }

  var injected = {};

  module.exports.create = function(name, actions) {
    injected[name] = new Module(actions);
  }

  module.exports.get = function(module) {
    return injected[module];
  }

  module.exports.inject = function(req, res, next) {
    /*var content = res.locals.routes.current.page.content || [];
    content.filter(section => 'module' in section).forEach(module => {
      var data = x.name.split('.');
      var args = x.args.reduce((dict, arg) => (dict[arg.key] = arg.value) && dict, {});
      var action = this.get(data[0]).exec(data.slice(1).join('.'), args);
      action(req, res);
    });*/

    next();
  }
})();
