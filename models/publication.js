;(function() {
  'use strict';

  const urlify = require('urlify').create({
    spaces: '-',
    nonPrintable: '-',
    trim: true,
    toLower: true
  });

  const modelName = 'Publication';
  const tableName = 'publications';

  module.exports = function(mongoose) {
    const ObjectId = mongoose.Schema.Types.ObjectId;

    let schema = new mongoose.Schema({
      insertId: { type: Number, unique: true, required: true },
      categoryId: { type: ObjectId, required: true, ref: 'Category' },
      path: String,
      name: { type: String, required: true },
      info: String,
      authors: [String],
      isbn: String,
      description: String,
      price: Number,
      isForSale: Boolean,
      isSoldout: Boolean,
      publishYear: Number,
      frontCover: { type: String, required: true },
      backCover: String,
      position: { type: Number, required: true },
      visible: { type: Boolean, required: true },
    });

    schema.statics.getLatest = function(count) {
      return this
        .find({ visible: true })
        .sort({ insertId: -1 })
        .limit(count)
        .exec();
    };

    schema.statics.getByPath = function(path) {
      return this.findOne({ path: path }).exec()
        .then(publication => {
          return new Promise((resolve, reject) => {
            if (publication) {
              resolve(publication);
            }

            this.find({ visible: true })
              .then(publications => {
                resolve(publications.find(x => urlify(x.name) === path));
              });
          });
        });
      return publication.then()
      return publication || this.find({ visible: true }).find(x => urlify(x.name) === path);
    }

    schema.statics.getByCategory = function(category) {
      return this
        .find({ categoryId: category._id, visible: true })
        .sort({ position: -1 })
        .exec();
    };
    
    return mongoose.model(modelName, schema, tableName);
  }
})();
