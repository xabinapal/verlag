;(function() {
  'use strict';

  module.exports = Extension => class Page extends Extension {
    _constructor() {
      this.showMenu.context = Extension.SECTION;
      this.setSubtitleLink.context = Extension.ROUTER | Extension.SECTION;
    }

    showMenu(ctx) {
      ctx.content = ctx.render({
        menu: ctx.menus.findByKey(ctx.arg('menu'))
      });

      ctx.next();
    }

    setSubtitleLink(ctx) {
      let route = ctx.arg('route');
      let local = ctx.arg('local');
      let extension = ctx.arg('extension');
      let link;

      if (route) {
        link = route;
      } else if (local) {
        link = ctx.locals[local];
      } else if (extension) {
        link = ctx.locals.extensions.get(extension.extension).get(extension.key);
      } else {
        ctx.next();
        return;
      }

      console.log(link);

      switch (ctx.type) {
        case ctx.ROUTER:
          ctx.routers.current.page.subtitleLink = link;
          break;
        case ctx.SECTION:
          ctx.section.subtitleLink = link;
          break;
      }

      ctx.next();
    }
  }
})();
