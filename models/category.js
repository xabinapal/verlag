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
    
    return mongoose.model('Category', schema);
  }
})();
