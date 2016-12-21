;(function() {
  'use strict';

  module.exports = () => {
    const bodyParser = require('body-parser');
    const escapeHtml = require('escape-html');
    const express = require('express');
    const path = require('path');

    const menu = require('./menu');
    const extensions = require('./extensions');
    const router = require('./router');

    const app = express();
    const set = app.set;

    let _locals = undefined;
    let _logger = undefined;
    let _models = undefined;
    let _extensions = undefined;

    app.set('view getter', view => {
      view = path.join(app.get('views').path, view);
      !path.extname(view) && (view += '.' + app.get('views').engine);
      return view;
    });

    app.set = function(setting, val) {
      if (arguments.length !== 2) {
        return set.bind(app)(...arguments);
      }

      switch (setting) {
        case 'locals':
          _locals = val;
          break;

        case 'logger':
          _logger = val;
          break;

        case 'models':
          _models = val;
          break;

        case 'extensions':
          _extensions = new extensions.ExtensionCollection(val);
          break;

        default:
          _logger && _logger.log(_logger.debug, 'setting {0}: {1}', setting, val);
          return set.bind(app)(...arguments);
      }

      return app;
    };

    app.disable('x-powered-by');

    app.use((req, res, next) => _logger ? _logger.requestLogger(req, res, next) : next());
    app.use((req, res, next) => _logger ? _logger.responseLogger(req, res, next) : next());

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.use(function (req, res, next) {
      process.on('unhandledRejection', function(reason, p) {
        let err = new Error(reason);
        err.status = 500;
        return next(err);
      });

      next();
    });

    app.use((req, res, next) => {
      _logger.log(_logger.info, 'processing request: {0}', req.path);
      [req.logger, req.models] = [_logger, _models];
      res.locals = _locals || {};
      next();
    });

    app.get('/robots.txt', (req, res, next) => {
      // TODO
      res.end();
    });

    app.get('/sitemap.xml', (req, res, next) => {
      // TODO
      res.end();
    });

    app.use((req, res, next) => {
      let routers = _models.page.getAll();
      let menus = _models.menu.getAll();

      Promise.all([routers, menus]).then(results => {
        _logger.log(_logger.debug, '{0} router(s) found', results[0].length);
        res.locals.routers = new router.RouterCollection(req, results[0]);
        req.current = res.locals.routers.current;

        _logger.log(_logger.debug, '{0} menu(s) found', results[1].length);
        res.locals.menus = new menu.MenuCollection(res.locals.routers, results[1]);

        next();
      });
    });

    app.use((req, res, next) => {
      if (!req.current) {
        return next(404);
      }

      req.current.page.getData().then(page => {
        let content = page.content.map(section => {
          if (!req.current.evaluateConditions(section.conditions)) {
            return null;
          }

          section.content = escapeHtml(section.content);
          return section;
        }).filter(section => section !== null);

        _logger.log(_logger.debug, '{0} section(s) found in current route', content.length);
        page.content = content;
        req.current.page = page;
        next();
      });
    });

    app.use((req, res, next) => _extensions ? _extensions.inject(req, res, next) : next());

    app.use((req, res, next) => {
      res.locals.ajax = req.headers['X-Requested-With'] === 'XMLHttpRequest';

      let message;
      if (res.locals.ajax) {
        message = 'rendering ajax request {0}';
      } else {
        message = 'rendering request {0}';
      }

      _logger.log(_logger.info, message, req.path);
      let view = app.get('views').page;
      res.render(app.get('view getter')(view));
    });

    app.use((err, req, res, next) => {
      let status, message, stack, params;

      if (err instanceof Error) {
        status = err.status || 500;
        message = 'error processing request {0}: {1} {2}';
        params = [req.path, status, err.message];
        stack = err.stack;

        res.locals.message = err.message;
        res.locals.error = app.get('env') === 'development' ? err : {};
      } else {
        status = parseInt(err) || 500;
        message = 'error processing request {0}: {1}';
        params = [req.path, status];
      }

      _logger.log(_logger.warn, message, ...params);
      if (stack) {
        _logger.log(_logger.debug, '{0}', stack);
      }

      let views = app.get('views').error;
      let view = views[status] || views.other;

      res.status(status);
      res.render(app.get('view getter')(view));
    });

    return app;
  };
})();
