;(function() {
  'use strict';

  const name = 'markdown';
  const actions = [parse];

  const showdown = require('showdown');
  
  function parse(section, args, ctx) {
    section.content = new showdown.Converter().makeHtml(section.content);
    ctx.next();
  }

  module.exports = factory => factory.create(name, actions);
})();
