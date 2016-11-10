;(function() {
  'use strict';

  module.exports = function(models) {
    return function(req, res, next) {
      var category = res.locals.current.getParamVal('catalog/category');
      var publication = res.locals.current.getParamVal('catalog/publication');

      if (publication) {
          res.locals.view = 'catalog-publications';
          next();
      } else if (category) {  
        res.locals.view = 'catalog-publications';
        res.locals.catalog = Object.create({
          category: undefined,
          publications: undefined
        });

        models.category.getByPath(category)
          .then(function(category) {
            res.locals.catalog.category = category;
            return models.publication.getByCategory(category.id);
          }).then(function(publications) {
            res.locals.catalog.publications = publications;
            next();
          });
      } else {
        models.category.getAll()
          .then(function(categories) {
            res.locals.categories = categories;
            res.locals.view = 'catalog-categories';
            next();
          });
      }
    }
  }
})();
