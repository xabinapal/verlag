;(function() {
  'use strict';

  const name = 'menu';
  const actions = [show];

  const pug = require('pug');

  function show(section, args, req, res, next) {
    let view = req.app.get('view getter')(args.get('view'));
    section.content = pug.renderFile(view, {
      menu: res.locals.routes.menus.get(args.get('menu'))
    });
    next();
  }

  module.exports = factory => factory.create(name, actions);
})();
