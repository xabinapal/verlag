;(function() {
  'use strict';

  module.exports = function(models) {
    return function(req, res, next) {
      var category = res.locals.current.parameter('catalog/category');
      var publication = res.locals.current.parameter('catalog/publication');
      console.log(category);
      console.log(publication);


      if (publication) {

      } else if (category) {

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
