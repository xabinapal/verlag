;(function() {
  'use strict';

  module.exports = Module => class menu extends Module {
    _constructor() {
      this.show.context = Module.SECTION;
    }

    show(ctx) {
      ctx.content = ctx.render({
        menu: ctx.menus.findByKey(ctx.arg('menu'))
      });

      ctx.next();
    }
  }
})();
