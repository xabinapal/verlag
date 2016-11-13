;(function() {
  'use strict';

  function conditional(route, condition) {
    condition = condition.split(/\s+/);
    switch (condition[0]) {
      case 'parameter':
        return parameter(route, condition);

      default:
        return false;
    }
  }

  function parameter(route, condition) {
    if (condition.length !== 3) {
      return false;
    }

    var set = condition[1] in route.keys;
    switch (condition[2]) {
      case 'set':
        return set;

      case 'unset':
        return !set;

      default:
        return false;
    }
  }

  module.exports = conditional;
})();
