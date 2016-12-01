;(function() {
  'use strict';

  const name = 'menu';
  const actions = [show];

  function show(ctx) {
    ctx.content = ctx.render({
      menu: ctx.menus.findByKey(ctx.arg('menu'))
    });

    ctx.next();
  }

  module.exports = factory => factory.create(name, actions);
})();
