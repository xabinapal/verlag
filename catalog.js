;(function() {
  'use strict';

  module.exports = function(models) {
    return function(req, res, next) {
      var category = res.locals.current.getParamVal('catalog/category');
      var publication = res.locals.current.getParamVal('catalog/publication');

      if (publication) {
          next();
      } else if (category) {
        models.category.getByPath(category, function(err, category) {
          res.locals.category = category;
          res.locals.view = 'catalog-publications';
          next();
        });
      } else {
        models.category.getAllCategories(function(err, categories) {
          res.locals.categories = categories;
          res.locals.view = 'catalog-categories';
          next();
        });
      }
    }
  }
})();
