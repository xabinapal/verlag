;(function() {
  'use strict';

  const modelName = 'Menu';
  const tableName = 'menus';

  module.exports = function(mongoose) {
    var schema = new mongoose.Schema({
      name: String,
    });

    return mongoose.model(modelName, schema, tableName);
  }
})();
