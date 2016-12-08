;(function() {
  'use strict';

  const urlify = require('urlify').create({
    spaces: '-',
    nonPrintable: '-',
    trim: true,
    toLower: true
  });

  module.exports = Extension => class Catalog extends Extension {
    _constructor() {
      this.categories.context = Extension.SECTION;
      this.publications.context = Extension.SECTION;
      this.publication.context = Extension.SECTION;
      this.latest.context = Extension.SECTION;
    }

    categories(ctx) {
      ctx.models.category.getAll()
        .then(categories => {
          categories.forEach(category => {
            category.route = ctx.routers.current.create([{
              key: 'category',
              value: category.path
            }]);
          });

          ctx.content = ctx.render({ categories });
          ctx.next();
        });
    }

    publications(ctx) {
      ctx.set('subtitleLink', ctx.routers.current.create());
      
      ctx.models.category.getByPath(ctx.routers.current.getParameter('category'))
        .then(category => {
          ctx.section.title = ctx.section.title.replace(ctx.arg('replace'), category.get('name'));
          ctx.section.category = category;
          return ctx.models.publication.getByCategory(category);
        }).then(publications => {
          ctx.content = ctx.render({ publications });
          ctx.next();
        });
    }

    publication(ctx) {
      let locals = {
        publication: undefined,
        category: undefined
      };

      let subtitleLink = ctx.routers.current.create([{
        category: ctx.routers.current.getParameter('category')
      }]);

      ctx.set('subtitleLink', subtitleLink);

      ctx.models.publication.getByPath(ctx.routers.current.getParameter('publication'))
        .then(publication => {
          locals.publication = publication;
          return ctx.models.category.getById(publication.categoryId);
        }).then(category => {
          locals.category = category;
          ctx.section.title = ctx.section.title.replace(ctx.arg('replace'), category.name);
          ctx.content = ctx.render(locals);
          ctx.next();
        });
    }

    latest(ctx) {
      let locals = {
        latest: undefined,
        count: ctx.arg('count')
      };

      ctx.models.publication.getLatest(ctx.arg('count'))
        .then(publications => {
          locals.latest = publications;
          let categories = new Set(publications.map(publication => publication.categoryId.toHexString()));
          return ctx.models.category.getById(categories);
        }).then(categories => {
          locals.latest.forEach(publication => {
            let category = (categories || []).find(category => category._id.equals(publication.categoryId));
            if (category) {
              let params = ctx.arg('params').map(x => ({
                key: x.key,
                value: x.value
                  .replace('{category}', category.path)
                  .replace('{publication}', urlify(publication.name))
              }));

              publication.route = ctx.routers.findByBasePath(ctx.arg('route')).create(params);
            }
          });

          ctx.content = ctx.render(locals);
          ctx.next();
        });
    }
  }
})();
