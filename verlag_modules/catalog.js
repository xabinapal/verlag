;(function() {
  'use strict';

  const name = 'catalog';
  const actions = [categories, publications, latest];

  const pug = require('pug');

  function categories(section, args, ctx) {
    let view = ctx.view(args.get('view'));
    ctx.models.category.getAll()
      .then(categories => {
        section.content = pug.renderFile(view, {
          current: ctx.current,
          categories: categories
        });

        ctx.next();
      });
  }

  function publications(section, args, ctx) {
    let view = ctx.view(args.get('view'));
    ctx.models.category.getByPath(ctx.current.getParameter('category'))
      .then(category => {
        section.title = section.title.replace(args.get('replace'), category.get('name'));
        section.category = category;
        return ctx.models.publication.getByCategory(category);
      }).then(publications => {
        section.content = pug.renderFile(view, {
          current: ctx.current.current,
          category: section.category,
          publications: publications
        });

        ctx.next();
      });
  }

  publications.args = { replace: String };

  function latest(section, args, ctx) {
    let view = ctx.view(args.get('view'));
    ctx.models.publication.getLatest(args.get('count'))
      .then(publications => {
        section.content = pug.renderFile(view, {
          publications: publications,
          count: args.get('count')
        });

        ctx.next();
      });
  }

  module.exports = factory => factory.create(name, actions);
})();
