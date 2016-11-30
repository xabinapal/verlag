;'use strict';

class Menu {
  constructor(menu) {
    this.menu = menu;
    this.pages = new Set();
    this.data = new Map();
  }

  addPage(route) {
    let page = route.page.menus.find(p => p.menu.equals(this.menu._id));
    this.pages.add(route);
    this.data.set(route.page.id, page);
  }

  getPages() {
    return Array.from(this.pages)
      .slice()
      .sort((a, b) => this.getPageData(a).position - this.getPageData(b).position);
  }

  getPageData(route) {
    return this.data.get(route.page.id);
  }

  getPageTitle(route) {
    return this.getPageData(route).title || route.page.title;
  }
}

module.exports = Menu;
