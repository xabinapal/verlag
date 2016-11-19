;(function() {
  'use strict';

  const name = 'form';
  const actions = [show];

  const pug = require('pug');

  function show(section, args, req, res, next) {
    let view = req.app.get('view getter')(args.get('view'));
    section.content = pug.renderFile(view);
    next();
  }

  module.exports = factory => factory.create(name, actions);
})();
