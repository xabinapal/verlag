;(function() {
  'use strict';

  const name = 'menu';
  const actions = [show];

  function show(ctx) {
    ctx.section.content = ctx.render({
      menu: ctx.locals.routes.menus.get(ctx.arg('menu'))
    });

    ctx.next();
  }

  module.exports = factory => factory.create(name, actions);
})();
