;(function() {
  'use strict';

  const name = 'contact';
  const actions = [form, send];
  
  var path = require('path');
  var pug = require('pug');

  function form(section, args, req, res, next) {
    var view = req.app.get('view getter')(args.view);
    section.content = pug.renderFile(view);
  }

  function send(section, args, req, res, next) {

  }

  module.exports = factory => factory.create(name, actions);
})();
