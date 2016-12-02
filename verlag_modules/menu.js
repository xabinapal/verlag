;(function() {
  'use strict';

  module.exports = Module => class Menu extends Module {
    constructor() {
      this.show = Module.SECTION;
    }

    show(ctx) {
      ctx.content = ctx.render({
        menu: ctx.menus.findByKey(ctx.arg('menu'))
      });

      ctx.next();
    }
  }
})();
