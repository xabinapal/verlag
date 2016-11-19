;(function() {
  'use strict';

  function Menu(menu) {
    if (!(this instanceof Menu)) {
      return new Menu(menu);
    }

    this.menu = menu;
    this.pages = new Set();
    this.data = new Map();
  }

  Menu.prototype.addPage = function(route) {
    let page = route.page.menus.find(p => p.menu.equals(this.menu._id));
    this.pages.add(route);
    this.data.set(route.page._id.toHexString(), page);
  }

  Menu.prototype.getPages = function() {
    return Array.from(this.pages)
      .slice()
      .sort((a, b) => this.getPageData(a).position - this.getPageData(b).position);
  }

  Menu.prototype.getPageData = function(route) {
    return this.data.get(route.page._id.toHexString());
  }

  Menu.prototype.getPageTitle = function(route) {
    return this.getPageData(route).title || route.page.title;
  }

  module.exports = Menu;
})();
