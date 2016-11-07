;(function() {
  'use strict';

  module.exports = function(mongoose) {
    var schema = new mongoose.Schema({
      'category_id': { 'type': mongoose.Schema.Types.ObjectId, 'required': true, 'ref': 'Category' },
      'name': { 'type': String, 'required': true },
      'info': String,
      'author': String,
      'isbn': String,
      'description': String,
      'price': Number,
      'soldout': Boolean,
      'publish_year': Number,
      'image': { 'type': String, 'required': true },
      'position': { 'type': Number, 'required': true },
      'visible': { 'type': Boolean, 'required': true },
    });

    schema.statics.findByCategory = function(id, cb) {
      return this.find({ category_id: id }, cb);
    };
    
    return mongoose.model('Publication', schema);
  }
})();
