;(function() {
  'use strict';

  var debug = require('debug')('verlag:conditional');

  function conditional(route, condition) {
    let result;
    let split = condition.split(/\s+/);

    switch (split[0]) {
      case 'path':
        result = path(route, split);
        break;

      case 'parameter':
        result = parameter(route, split);
        break;

      default:
        debug('%s: invalid condition: %s', route.id, condition);
        return false;
    }
  
    if (result === null) {
      debug('%s: invalid %s condition: %s', route.id, split[0], condition);
      return false;
    }

    debug('%s: %s condition result: %s === %s', route.id, split[0], condition, result);
    return result;
  }

  function path(route, condition) {
    if (condition.length !== 3) {
      return null;
    }

    let result;
    let set = route.isOptionalPathSet(condition[1]);
    switch (condition[2]) {
      case 'set':
        result = set;
        break;

      case 'unset':
        result = !set;
        break;

      default:
        return null;
    }

    return result || false;
  }

  function parameter(route, condition) {
    if (condition.length !== 3) {
      return null;
    }

    let result;
    let set = route.getParameterValue(condition[1]);
    switch (condition[2]) {
      case 'set':
        result = set && set.length > 0;
        break;

      case 'unset':
        result = !set || set.length === 0;
        break;

      default:
        return null;
    }

    return result || false;
  }

  module.exports = conditional;
})();
