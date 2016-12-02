;(function() {
  'use strict';

  const showdown = require('showdown');

  module.exports = Module => class Markdown extends Module {
    constructor() {
      this.parse.context = Module.SECTION;
    }
  
    parse(ctx) {
      ctx.content = new showdown.Converter().makeHtml(ctx.section.content);
      ctx.next();
    }
  }
})();
