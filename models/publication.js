;(function() {
  'use strict';

  const modelName = 'Publication';
  const tableName = 'publications';

  module.exports = function(mongoose) {
    const ObjectId = mongoose.Schema.Types.ObjectId;

    let schema = new mongoose.Schema({
      insertId: { type: Number, unique: true, required: true },
      categoryId: { type: ObjectId, required: true, ref: 'Category' },
      name: { type: String, required: true },
      info: String,
      authors: [String],
      isbn: String,
      description: String,
      price: Number,
      isForSale: Boolean,
      isSoldout: Boolean,
      publishYear: Number,
      image: { type: String, required: true },
      position: { type: Number, required: true },
      visible: { type: Boolean, required: true },
    });


    schema.statics.getLatest = function(count) {
      return this
        .find()
        .sort({ insertId: -1 })
        .limit(count)
        .exec();
    };

    schema.statics.getByCategory = function(category) {
      return this.find({ categoryId: category._id }).sort({ position: -1 }).exec();
    };
    
    return mongoose.model(modelName, schema, tableName);
  }
})();
