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
        
      } else {
        res.locals.view = 'catalog-categories';
        
      }
    }
  }
})();
