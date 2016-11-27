;(function() {
  'use strict';

  const modelName = 'Page';
  const tableName = 'pages';

  module.exports = function(mongoose) {
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var pathSchema = new mongoose.Schema({
      type: { type: String, required: true },
      key: { type: String, unique: true, required: true },
      parameter: Boolean,
      optional: Boolean
    });

    var moduleSchema = new mongoose.Schema({
      name: { type: String, required: true },
      action: { type: String, required: true },
      args: [
        {
          key: String,
          value: Object
        }
      ],
      conditions: [String]
    });

    var contentSchema = new mongoose.Schema({
      main: String,
      title: String,
      content: String,
      modules: [moduleSchema],
      conditions: [String]
    });

    var menuSchema = new mongoose.Schema({
      menu: { type: ObjectId, required: true, ref: 'Menu' },
      position: { type: Number, required: true },
      title: String
    });

    var schema = new mongoose.Schema({
      basePath: { type: String, unique: true },
      path: [pathSchema],
      title: { type: String, required: true },
      modules: [moduleSchema],
      content: [contentSchema],
      menus: [menuSchema]
    });

    schema.statics.getAll = function() {
      return this.find({})
        .select('index basePath path title menus')
        .sort({ position: 1 })
        .exec();
    };

    schema.methods.getData = function() {
      return this.model(modelName).findById(this._id).exec();
    };

    return mongoose.model(modelName, schema, tableName);
  }
})();
