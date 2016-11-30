;(function() {
  'use strict';

  const modelName = 'Category';
  const tableName = 'categories';

  module.exports = function(mongoose) {
    var schema = new mongoose.Schema({
      path: { type: String, unique: true },
      name: { type: String, required: true },
      image: { type: String, required: true },
      position: { type: Number, required: true },
      visible: { type: Boolean, required: true },
    });

    schema.statics.getAll = function() {
      return this.find({ visible: true }).sort({ position: 1 }).exec();
    };

    schema.statics.getById = function(ids) {
      return ids instanceof Array
        ? this.find({ _id: { "$in": ids }}).exec()
        : this.findOne({ _id: ids }).exec();
    }

    schema.statics.getByPath = function(path) {
      return this.findOne({ path: path }).exec();
    };
    
    return mongoose.model(modelName, schema, tableName);
  }
})();
