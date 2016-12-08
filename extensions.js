;(function() {
  'use strict';

  const stringcase = require('stringcase');

  const conditional = require('./conditional');
  const context = require('./context');

  class Extension {
    constructor() {
      this._constructor();
    }

    get name() {
      return stringcase.camelcase(this.constructor.name);
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
    .forEach(ctx => Extension[ctx.name] = ctx.value);

  let extensionFactory = obj => {
    let extension = new (obj(Extension));
    let actions = [...context.types.values()]
      .map(context => [
        context.value,
        new Map(extension.actions
          .filter(action => action.context & context.value)
          .map(action => [action.name, action]))]);

    return [extension.name, new Map(actions)];
  };

  class ExtensionCollection extends Map {
    constructor(extensions) {
      super((extensions || []).map(extensionFactory));
    }

    inject(req, res, next) {
      this.logger = req.logger.create('extensions');
      this.ctx = context(req, res, this.logger);
      this.req = req;

      let extensions = this.select(
        Extension.ROUTER,
        req.current.page.extensions,
        extension => !extension.postExecute);

      extensions = extensions.concat(
        (req.current.page.content || [])
          .filter(section => section.extensions.length)
          .map(section => this.select(Extension.SECTION, section.extensions, null, section))
          .reduce((a, b) => a.concat(b), []));

      extensions = extensions.concat(this.select(
        Extension.ROUTER,
        req.current.page.extensions,
        extension => extension.postExecute));

      (function exec(index) {
        let ctx = index < extensions.length ? extensions[index] : null;
        return ctx ? err => err && next(err) || ctx.call(exec(index + 1)) : next;
      })(0)();
    }

    select(type, extensions, condition, section) {
      return (extensions || [])
        .filter(extension => condition ? condition(extension) : true)
        .filter(extension => this.req.current.evaluateConditions(extension.conditions))
        .map(extension => this.parser(type, extension))
        .map(extension => new (this.ctx.get(type))(extension, section));
    }

    parser(context, data) {
      let extension = super.get(data.name);
      if (!extension) {
        this.logger.log(this.logger.error, 'extension {0} does not exist', data.name);
      }

      let action = extension && extension.get(context).get(data.action);
      if (!action) {
        this.logger.log(this.logger.error, 'extension {0} action {1}.{2} does not exist', data.name, data.action);
      }

      return {
        data: data,
        action: action
      }
    }
  }

  module.exports.Extension = Extension;
  module.exports.ExtensionCollection = ExtensionCollection;
})();
