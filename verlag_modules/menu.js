;(function() {
  'use strict';

  const name = 'menu';
  const actions = [show];

  var pug = require('pug');

  function show(section, args, req, res, next) {
    var view = req.app.get('view getter')(args.view);
    section.content = pug.renderFile(view, {
      menu: res.locals.routes.menus[args.menu]
    });
    next();
  }

  module.exports = factory => factory.create(name, actions);
})();
