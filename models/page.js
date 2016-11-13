;(function() {
  'use strict';

  const modelName = 'Page';
  const tableName = 'pages';

  module.exports = function(mongoose) {
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var moduleSchema = new mongoose.Schema({
      name: { type: String, required: true },
      action: { type: String, required: true },
      args: [
        {
          key: String,
          value: String
        }
      ]
    });

    var schema = new mongoose.Schema({
      path: { type: String, unique: true },
      parameters: [{
        type: { type: String, required: true },
        key: { type: String, unique: true, required: true },
        optional: Boolean
      }],
      title: { type: String, required: true },
      content: [
        {
          main: String,
          title: String,
          content: [String],
          module: moduleSchema,
          conditions: [String]
      }],
      menus: [
        {
          menu: { type: ObjectId, required: true, ref: 'Menu' },
          position: { type: Number, required: true },
          title: String
        }
      ]
    });

    schema.statics.getAll = function() {
      return this.find({})
        .select('index path parameters title menus')
        .sort({ position: 1 })
        .exec();
    };

    schema.methods.getData = function() {
      return this.model(modelName).findById(this._id).exec();
    };

    return mongoose.model(modelName, schema, tableName);
  }
})();
