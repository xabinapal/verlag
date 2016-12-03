;(function() {
  'use strict';

  const modelName = 'Menu';
  const tableName = 'menus';

  module.exports = function(mongoose) {
    let schema = new mongoose.Schema({
      key: { type: String, unique: true, required: true },
      name: { type: String, unique: true, required: true }
    });

    schema.statics.getAll = function() {
      return this.find({}).exec();
    };

    return mongoose.model(modelName, schema, tableName);
  }
})();
