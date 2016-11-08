;(function() {
  'use strict';

  module.exports = function(mongoose) {
    var schema = new mongoose.Schema({
      'index': Boolean,
      'path': { 'type': String, 'index': true },
      'title': { 'type': String, 'required': true },
      'full_title': String,
      'content': [{
        'main': String,
        'title': String,
        'content': [String]
      }],
      'catalog': Boolean,
      'position': { 'type': Number, 'required': true },
    });

    schema.statics.getAllPages = function(cb) {
      this.find({}, 'index path title position', { sort: { position: 1 } }, cb);
    };

    return mongoose.model('Page', schema, 'pages');
  }
})();
