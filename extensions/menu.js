;(function() {
  'use strict';

  module.exports = Extension => class Menu extends Extension {
    _constructor() {
      this.show.context = Extension.SECTION;
    }

    show(ctx) {
      ctx.content = ctx.render({
        menu: ctx.menus.findByKey(ctx.arg('menu'))
      });

      ctx.next();
    }
  }
})();
