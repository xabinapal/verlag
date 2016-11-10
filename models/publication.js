;(function() {
  'use strict';

  const modelName = 'Publication';
  const tableName = 'publications';

  module.exports = function(mongoose) {
    var schema = new mongoose.Schema({
      categoryId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Category' },
      name: { type: String, required: true },
      info: String,
      author: String,
      isbn: String,
      description: String,
      price: Number,
      soldout: Boolean,
      publishYear: Number,
      image: { type: String, required: true },
      position: { type: Number, required: true },
      visible: { type: Boolean, required: true },
    });

    schema.statics.getByCategory = function(category) {
      return this.find({ category_id: category._id }).exec();
    };
    
    return mongoose.model(modelName, schema, tableName);
  }
})();
