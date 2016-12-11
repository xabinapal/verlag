;(function() {
  'use strict';

  module.exports = locals => {
    const bodyParser = require('body-parser');
    const escapeHtml = require('escape-html');
    const express = require('express');
    const path = require('path');

    const menu = require('./menu');
    const extensions = require('./extensions');
    const router = require('./router');

    const app = express();
    const set = app.set;

    let _logger = undefined;
    let _models = undefined;
    let _extensions = undefined;

    app.set('view getter', view => {
      view = path.join(app.get('views'), view);
      !path.extname(view) && (view += '.' + app.get('view engine'));
      return view;
    });

    app.set = function(setting, val) {
      if (arguments.length !== 2) {
        return set.bind(app)(...arguments);
      }

      switch (setting) {
        case 'logger':
          _logger = val.create('app', true);
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
      res.locals = locals;
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
      let routers;
      _models.page.getAll().then(pages => {
        routers = new router.RouterCollection(req, pages);
        req.current = routers.current;
        return _models.menu.getAll();
      }).then(menus => {
        res.locals.menus = new menu.MenuCollection(routers, menus);
        res.locals.routers = routers;
        next();
      });
    });

    app.use((req, res, next) => {
      if (!req.current) {
        let err = new Error('Not found');
        err.status = 404;
        return next(err);
      }

      req.current.page.getData().then(page => {
        let content = page.content.map(section => {
          if (!req.current.evaluateConditions(section.conditions)) {
            return null;
          }

          section.content = escapeHtml(section.content);
          return section;
        }).filter(section => section !== null);

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
      res.render(app.get('page view'));
    });

    app.use((err, req, res, next) => {
      let status = err.status || 500;
      let views = app.get('error views');
      let view = views[status] || views.other;

      _logger.log(_logger.warn, 'error processing request {0}: {1} {2}', req.path, status, err.message);
      res.locals.message = err.message;
      res.locals.error = app.get('env') === 'development' ? err : {};

      res.status(status || 500);
      res.render(view);
    });

    return app;
  };
})();
