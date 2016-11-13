;(function() {
  'use strict';

  const name = 'markdown';
  const actions = [parse];

  var showdown = require('showdown');
  
  function parse(section, args, req, res, next) {
    section.content = new showdown.Converter().makeHtml(section.content);
    next();
  }

  module.exports = factory => factory.create(name, actions);
})();
