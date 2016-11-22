;(function() {
  'use strict';

  module.exports = (route, condition) => {
    let logger = route.logger.create('conditional');

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
        logger.log(logger.warn, 'invalid condition: {0}', condition);
        return false;
    }
  
    if (result === null) {
      logger.log(logger.warn, 'invalid {0} condition: {1}', split[0], condition);
      return false;
    }

    logger.log(logger.info, '{0} condition result: {1} === {2}', split[0], condition, result);
    return result;
  };

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
    let set = route.getParameter(condition[1]);
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
})();
