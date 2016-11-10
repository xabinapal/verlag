;(function() {
  'use strict';

  function Menu(menu) {
    if (!(this instanceof Menu)) {
      return new Menu(menu);
    }

    this.menu = menu;
    this.pages = new Set();
  }

  Menu.prototype.addPage = function(page) {
    this.pages.add(page);
  }

  Menu.prototype.getPages = function() {
    return Array.from(this.pages)
      .slice()
      .sort((a, b) => {
        var a = a.page.menus.find(m => m.menu.equals(this.menu._id)).position;
        var b = b.page.menus.find(m => m.menu.equals(this.menu._id)).position;
        return a - b;
      });
  }

  module.exports = Menu;
})();
