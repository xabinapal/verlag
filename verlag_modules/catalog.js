;(function() {
  'use strict';

  const name = 'catalog';
  const actions = [categories, publications, latest];

  var path = require('path');
  var pug = require('pug');

  function categories(section, args, req, res, next) {
    var view = req.app.get('view getter')(args.view);
    req.models.category.getAll()
      .then(function(categories) {
        section.content = pug.renderFile(view, {
          current: res.locals.routes.current,
          categories: categories
        });
      });
  }

  function publications(section, args, req, res, next) {
    var view = req.app.get('view getter')(args.view);
    req.models.category.getByPath(category)
      .then(function(category) {
        section.title = section.title.replace(args.replace, category.name);
        return req.models.publication.getByCategory(category);
      }).then(function(publications) {
        section.content = pug.renderFile(view, {
          current: res.locals.routes.current,
          publications: publications
        });
      });
  }

  publications.args = { replace: String };

  function latest(section, args, req, res, next) {
    var view = req.app.get('view getter')(args.view);
    req.models.publication.getLatest()
      .then(function(publications) {
        section.content = pug.renderFile(view, { publications: publications });
      });
  }

  module.exports = factory => factory.create(name, actions);
})();
