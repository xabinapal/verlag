;(function() {
  'use strict';

  const name = 'catalog';
  const actions = [categories, publications, latest];

  function categories(ctx) {
    ctx.models.category.getAll()
      .then(categories => {
        ctx.section.content = ctx.render({
          current: ctx.current,
          categories: categories
        });

        ctx.next();
      });
  }

  function publications(ctx) {
    ctx.models.category.getByPath(ctx.current.getParameter('category'))
      .then(category => {
        ctx.section.title = ctx.section.title.replace(ctx.arg('replace'), category.get('name'));
        ctx.section.category = category;
        return ctx.models.publication.getByCategory(category);
      }).then(publications => {
        ctx.section.content = ctx.render({
          current: ctx.current.current,
          category: ctx.section.category,
          publications: publications
        });

        ctx.next();
      });
  }

  publications.args = { replace: String };

  function latest(ctx) {
    ctx.models.publication.getLatest(ctx.arg('count'))
      .then(publications => {
        ctx.section.content = ctx.render({
          publications: publications,
          count: ctx.arg('count')
        });

        ctx.next();
      });
  }

  module.exports = factory => factory.create(name, actions);
})();
