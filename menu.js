;(function() {
  'use strict';

  function Menu(menu) {
    if (!(this instanceof Menu)) {
      return new Menu(menu);
    }

    this.menu = menu;
    this.pages = new Set();
    this.data = {}
  }

  Menu.prototype.addPage = function(route) {
    this.pages.add(route);
    this.data[route.page._id] = route.page.menus.find(p => p.menu.equals(this.menu._id));
  }

  Menu.prototype.getPages = function() {
    return Array.from(this.pages)
      .slice()
      .sort((a, b) => this.getPageData(a) - this.getPageData(b));
  }

  Menu.prototype.getPageData = function(route) {
    return this.data[route.page._id];
  }

  Menu.prototype.getPageTitle = function(route) {
    return this.data[route.page._id].title || route.page.title;
  }

  module.exports = Menu;
})();
