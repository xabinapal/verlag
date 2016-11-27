;(function() {
  'use strict';

  const name = 'menu';
  const actions = [show];

  const pug = require('pug');

  function show(section, args, ctx) {
    let view = ctx.view(args.get('view'));
    section.content = pug.renderFile(view, {
      menu: ctx.locals.routes.menus.get(args.get('menu'))
    });

    ctx.next();
  }

  module.exports = factory => factory.create(name, actions);
})();
