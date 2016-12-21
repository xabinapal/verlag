;(function() {
  'use strict';

  const showdown = require('showdown');

  module.exports = Extension => class Markdown extends Extension {
    _constructor() {
      this.parse.context = Extension.SECTION;
    }
  
    parse(ctx) {
      ctx.content = new showdown.Converter().makeHtml(ctx.section.content);
      return ctx.success();
    }
  }
})();
