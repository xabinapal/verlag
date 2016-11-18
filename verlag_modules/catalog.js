;(function() {
  'use strict';

  const name = 'catalog';
  const actions = [categories, publications, latest];

  const pug = require('pug');

  function categories(section, args, req, res, next) {
    let view = req.app.get('view getter')(args.view);
    req.models.category.getAll()
      .then(categories => {
        section.content = pug.renderFile(view, {
          current: res.locals.routes.current,
          categories: categories
        });

        next();
      });
  }

  function publications(section, args, req, res, next) {
    let view = req.app.get('view getter')(args.view);
    req.models.category.getByPath(res.locals.routes.current.getParameterValue('category'))
      .then(category => {
        section.title = section.title.replace(args.replace, category.name);
        section.category = category;
        return req.models.publication.getByCategory(category);
      }).then(publications => {
        section.content = pug.renderFile(view, {
          current: res.locals.routes.current,
          category: section.category,
          publications: publications
        });

        next();
      });
  }

  publications.args = { replace: String };

  function latest(section, args, req, res, next) {
    let view = req.app.get('view getter')(args.view);
    req.models.publication.getLatest(args.count)
      .then(publications => {
        section.content = pug.renderFile(view, {
          publications: publications,
          count: args.count
        });
        next();
      });
  }

  module.exports = factory => factory.create(name, actions);
})();
