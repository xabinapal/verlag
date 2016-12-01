;'use strict';

class Menu {
  constructor(menu) {
    [this._id, this.id] = [menu._id, menu.id];
    [this.key, this.name] = [menu.key, menu.name];

    this.pages = new Set();
    this.data = new Map();
  }

  addPage(route) {
    let page = route.page.menus.find(p => p.menu.equals(this._id));
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

class MenuCollection extends Array {
  constructor(menus) {
    super(...menus.map(x => new Menu(x)));
  }

  findById(_id) {
    return this.find(menu => menu._id.equals(_id));
  }

  findByKey(key) {
    return this.find(menu => menu.key === key);
  }
}

module.exports.Menu = Menu;
module.exports.MenuCollection = MenuCollection;
