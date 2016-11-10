;(function() {
  'use strict';

  module.exports = function(mongoose) {
    var schema = new mongoose.Schema({
      'index': Boolean,
      'path': { 'type': String, 'index': true },
      'parameters': [{
        'type': { 'type': String, 'required': true },
        'key': { 'type': String, 'required': true },
        'optional': Boolean
      }],
      'title': { 'type': String, 'required': true },
      'fullTitle': String,
      'content': [{
        'main': String,
        'title': String,
        'content': [String]
      }],
      'catalog': Boolean,
      'position': { 'type': Number, 'required': true },
    });

    schema.statics.getAllPages = function(cb) {
      this.find(
        {},
        'index path parameters title position',
        { sort: { position: 1 } },
        cb);
    };

    return mongoose.model('Page', schema, 'pages');
  }
})();
