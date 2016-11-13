;(function() {
  'use strict';

  const name = 'menu';
  const actions = [show];

  function show(section, args, req, res, next) {

  }

  module.exports = factory => factory.create(name, actions);
})();
