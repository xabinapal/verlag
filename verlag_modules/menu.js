;(function() {
  'use strict';

  const name = 'menu';
  const actions = [show];

  const pug = require('pug');

  function show(ctx) {
    let view = ctx.view;
    ctx.section.content = pug.renderFile(view, {
      menu: ctx.locals.routes.menus.get(ctx.arg('menu'))
    });

    ctx.next();
  }

  module.exports = factory => factory.create(name, actions);
})();
