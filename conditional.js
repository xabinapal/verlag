;(function() {
  'use strict';

  var debug = require('debug')('verlag:conditional');

  function conditional(route, condition) {
    condition = condition.split(/\s+/);
    switch (condition[0]) {
      case 'parameter':
        return parameter(route, condition);

      default:
        debug('%s: invalid condition: %s', route.id, condition.join(' '));
        return false;
    }
  }

  function parameter(route, condition) {
    if (condition.length !== 3) {
      debug('%s: invalid parameter condition: %s', route.id, condition.join(' '));
      return false;
    }

    var set = route.getParameterValue(condition[1]);
    var result;
    switch (condition[2]) {
      case 'set':
        result = set && set.length > 0;
        break;

      case 'unset':
        result = !set || set.length === 0;
        break;

      default:
        debug('%s: invalid parameter condition: %s', route.id, condition.join(' '));
        return false;
    }

    debug('%s: parameter condition result: %s === %s', route.id, condition.join(' '), result || false);
    return result || false;
  }

  module.exports = conditional;
})();
