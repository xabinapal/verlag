;(function() {
  'use strict';

  const name = 'markdown';
  const actions = [parse];

  const showdown = require('showdown');
  
  function parse(ctx) {
    ctx.section.content = new showdown.Converter().makeHtml(ctx.section.content);
    ctx.next();
  }

  module.exports = factory => factory.create(name, actions);
})();
