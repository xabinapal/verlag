;'use strict';

class Menu {
  constructor(menu) {
    [this._id, this.id] = [menu._id, menu.id];
    [this.key, this.name] = [menu.key, menu.name];

    this.pages = new Set();
    this.data = new Map();
  }

  addRouter(router) {
    let page = router.page.menus.find(p => p.menu.equals(this._id));
    this.pages.add(router);
    this.data.set(router.page.id, page);
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
  constructor(routers, menus) {
    super(...menus.map(x => new Menu(x)));
    routers.forEach(router => router.page.menus
      .forEach(m => this.findById(m.menu).addRouter(router)));
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
