;(function() {
  'use strict';

  const name = 'catalog';
  const actions = [categories, publications, latest];

  const pug = require('pug');

  function categories(section, args, logger, req, res, next) {
    let view = req.app.get('view getter')(args.get('view'));
    req.models.category.getAll()
      .then(categories => {
        section.content = pug.renderFile(view, {
          current: res.locals.routes.current,
          categories: categories
        });

        next();
      });
  }

  function publications(section, args, logger, req, res, next) {
    let view = req.app.get('view getter')(args.get('view'));
    req.models.category.getByPath(res.locals.routes.current.getParameter('category'))
      .then(category => {
        section.title = section.title.replace(args.get('replace'), category.get('name'));
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

  function latest(section, args, logger, req, res, next) {
    let view = req.app.get('view getter')(args.get('view'));
    req.models.publication.getLatest(args.get('count'))
      .then(publications => {
        section.content = pug.renderFile(view, {
          publications: publications,
          count: args.get('count')
        });
        next();
      });
  }

  module.exports = factory => factory.create(name, actions);
})();
