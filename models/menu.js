;(function() {
  'use strict';

  module.exports = function(mongoose) {
    var schema = new mongoose.Schema({
      'name': String,
    });

    return mongoose.model('Menu', schema, 'menus');
  }
})();
