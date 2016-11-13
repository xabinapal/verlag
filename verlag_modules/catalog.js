;(function() {
  'use strict';

  const name = 'catalog';
  const actions = [categories, publications, latest];

  var pug = require('pug');

  function categories(section, args) {
    models.category.getAll()
      .then(function(categories) {
        section.content = pug.renderFile(args.view, { categories: categories });
        next();
      });
  }

  function publications(section, args) {
    models.category.getByPath(category)
      .then(function(category) {
        section.title = section.title.replace(args.replace, category.name);
        return models.publication.getByCategory(category);
      }).then(function(publications) {
        section.content = pug.renderFile(args.view, { publications: publications });
        next();
      });
  }

  publications.args = { replace: String };

  function latest(section, args) {
    models.publication.getLatest()
      .then(function(publications) {
        res.locals.catalog.latest = publications;
      });
  }

  module.exports = factory => factory.create(name, actions);
})();
