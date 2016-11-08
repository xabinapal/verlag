;(function() {
  'use strict';

  module.exports = function(mongoose) {
    var schema = new mongoose.Schema({
      'normalized_name': { 'type': String, 'index': true },
      'name': { 'type': String, 'required': true },
      'image': { 'type': String, 'required': true },
      'position': { 'type': Number, 'required': true },
      'visible': { 'type': Boolean, 'required': true },
    });

    schema.statics.getAllCategories = function(cb) {
      this.find({ 'visible': true }, null, { sort: { position: 1 } }, cb);
    };

    schema.statics.getByPath = function(path, cb) {
      this.findOne({ 'normalized_name': path }, cb);
    };
    
    return mongoose.model('Category', schema, 'categories');
  }
})();
