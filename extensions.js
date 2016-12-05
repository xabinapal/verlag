;(function() {
  'use strict';

  const conditional = require('./conditional');
  const context = require('./context');

  class Extension {
    constructor() {
      this._constructor();
    }

    get name() {
      // camelCase
      let name = this.constructor.name.replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => {
        return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
      }).replace(/\s+/g, '');
      return name;
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
      let ctx = context(req, res, this.logger);

      let extensions = (req.current.page.extensions || [])
        .filter(extension => !extension.postExecute)
        .filter(extension => req.current.evaluateConditions(extension.conditions))
        .map(extension => this.parser(Extension.ROUTER, extension))
        .map(extension => new ctx.RouterContext(extension));

      extensions = extensions.concat(
        (req.current.page.content || [])
          .filter(section => section.extensions.length)
          .map(section => section.extensions
            .filter(extension => req.current.evaluateConditions(extension.conditions))
            .map(extension => this.parser(Extension.SECTION, extension))
            .map(extension => new ctx.SectionContext(extension, section)))
          .reduce((a, b) => a.concat(b), []));

      extensions.concat(
        (req.current.page.extensions || [])
          .filter(extension => extension.postExecute)
          .filter(extension => req.current.evaluateConditions(extension.conditions))
          .map(extension => this.parser(Extension.ROUTER, extension))
          .map(extension => new ctx.RouterContext(extension)));

      extensions.push(null);

      (function exec(index) {
        let ctx = index < extensions.length ? extensions[index] : null;
        return ctx ? err => err && next(err) || ctx.call(exec(index + 1)) : next;
      })(0)();
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
