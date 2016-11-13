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

    var set = route.getParameterValue(condition[1]);
    switch (condition[2]) {
      case 'set':
        return set && set.length > 0;

      case 'unset':
        return !set || set.length === 0;

      default:
        return false;
    }
  }

  module.exports = conditional;
})();
