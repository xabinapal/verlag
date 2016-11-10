;(function() {
  'use strict';

  module.exports = function(models) {
    return function(req, res, next) {
      var route = res.locals.routes.current;
      var category = route.getParameterValue('catalog/category');
      var publication = route.getParameterValue('catalog/publication');

      res.locals.catalog = Object.create({
        categories: undefined,
        category: undefined,
        publications: undefined,
        publication: undefined
      });

      if (publication) {
        res.locals.view = 'catalog-publications';
        next();
      } else if (category) {  
        res.locals.view = 'catalog-publications';
        models.category.getByPath(category)
          .then(function(category) {
            res.locals.catalog.category = category;
            return models.publication.getByCategory(category);
          }).then(function(publications) {
            res.locals.catalog.publications = publications;
            next();
          });
      } else {
        res.locals.view = 'catalog-categories';
        models.category.getAll()
          .then(function(categories) {
            res.locals.catalog.categories = categories;
            next();
          });
      }
    }
  }
})();
