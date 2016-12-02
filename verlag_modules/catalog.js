;(function() {
  'use strict';

  module.exports = Module => class Catalog extends Module {
    constructor() {
      this.categories.context = Module.SECTION;
      this.publications.context = Module.SECTION;
      this.publication.context = Module.SECTION;
      this.latest.context = MODULE.SECTION;
    }

    categories(ctx) {
      ctx.models.category.getAll()
        .then(categories => {
          ctx.content = ctx.render({
            current: ctx.routers.current,
            categories: categories
          });

          ctx.next();
        });
    }

    publications(ctx) {
      ctx.models.category.getByPath(ctx.routers.current.getParameter('category'))
        .then(category => {
          ctx.section.title = ctx.section.title.replace(ctx.arg('replace'), category.get('name'));
          ctx.section.category = category;
          return ctx.models.publication.getByCategory(category);
        }).then(publications => {
          ctx.content = ctx.render({
            current: ctx.routers.current,
            category: ctx.section.category,
            publications: publications
          });

          ctx.next();
        });
    }

    publication(ctx) {
      let locals = {
        category: undefined,
        publication: undefined
      };

      ctx.models.publication.getById(ctx.routers.current.getParameter('publication'))
        .then(publication => {
          locals.publication = publication;
          return ctx.models.category.getById(publication._id);
        }).then(category => {
          locals.category = publication;
          ctx.context = ctx.render(locals);
          next();
        });
    }

    latest(ctx) {
      let route = ctx.routers.findByBasePath(ctx.arg('route'));
      let latest = undefined;

      ctx.models.publication.getLatest(ctx.arg('count'))
        .then(publications => {
          latest = publications;
          let categories = new Set(latest.map(publication => publication.categoryId.toHexString()));
          return ctx.models.category.findById(categories);
        }).then(categories => {
          latest.forEach(publication => {
            let category = (categories || []).find(category => category._id.toHexString() === publication.categoryId);
            if (category) {
              let params = ctx.arg('params').map(x => ({
                key: x.key,
                value: x.value
                  .replace('{category}', category.path)
                  .replace('{publication}', publication.insertId)
              }));

              x.route = route.create(params);
            }
          });

          ctx.content = ctx.render({
            publications: latest,
            count: ctx.arg('count')
          });

          ctx.next();
        });
    }
  }
})();
