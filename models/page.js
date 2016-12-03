;(function() {
  'use strict';

  const modelName = 'Page';
  const tableName = 'pages';

  module.exports = function(mongoose) {
    const ObjectId = mongoose.Schema.Types.ObjectId;

    let pathSchema = new mongoose.Schema({
      type: { type: String, required: true },
      key: { type: String, unique: true, required: true },
      parameter: Boolean,
      optional: Boolean
    });

    let moduleSchema = new mongoose.Schema({
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

    let linkSchema = new mongoose.Schema({
      basePath: { type: String, required: true },
      path: [{
        key: { type: String, unique: true, required: true },
        value: { type: String, required: true }
      }]
    });

    let contentSchema = new mongoose.Schema({
      main: String,
      title: String,
      subtitle: String,
      subtitleLink: linkSchema,
      content: String,
      modules: [moduleSchema],
      conditions: [String]
    });

    let menuSchema = new mongoose.Schema({
      menu: { type: ObjectId, required: true, ref: 'Menu' },
      position: { type: Number, required: true },
      title: String
    });

    let schema = new mongoose.Schema({
      basePath: { type: String, unique: true },
      path: [pathSchema],
      title: { type: String, required: true },
      subtitle: String,
      subtitleLink: linkSchema,
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

    schema.methods.hasContent = function() {
      return this.content && this.content.length;
    }

    return mongoose.model(modelName, schema, tableName);
  }
})();
