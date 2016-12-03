;(function() {
  'use strict';

  module.exports = (locals) => {
    const bodyParser = require('body-parser');
    const escapeHtml = require('escape-html');
    const express = require('express');
    const path = require('path');

    const menu = require('./menu');
    const modules = require('./modules');
    const router = require('./router');

    const app = express();
    const set = app.set;

    let _logger = undefined;
    let _models = undefined;
    let _modules = new modules.ModuleCollection();

    app.set('view getter', view => {
      view = path.join(app.get('views'), view);
      !path.extname(view) && (view += '.' + app.get('view engine'));
      return view;
    });

    app.set = Object.bind((key, value) => {
      switch (key) {
        case 'logger':
          _logger = value.create('app', true);
          break;

        case 'models':
          _models = value;
          break;

        case 'modules':
          _modules = new modules.ModuleCollection(value);
          break;

        default:
          set(key, value);
      }
    }, app);

    app.set('test');

    app.disable('x-powered-by');

    app.use((req, res, next) => _logger && _logger.requestLogger(...arguments));
    app.use((req, res, next) => _logger && _logger.responseLogger(...arguments));

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.use((req, res, next) => {
      [req.logger, req.models] = [_logger, _models];
      res.locals = Object.assign({ modules: new Map() }, locals);
      _modules.list().forEach(m => res.locals.modules.set(m, new Map()));
      next();
    });

    app.get('/robots.txt', (req, res, next) => {
      _logger.log(_logger.info, 'processing request: /robots.txt');
      // TODO
      res.end();
    });

    app.get('/sitemap.xml', (req, res, next) => {
      _logger.log(_logger.info, 'processing request: /sitemap.xml');
      // TODO
      res.end();
    });

    app.use((req, res, next) => {
      _logger.log(_logger.info, 'processing request: {0}', req.path);

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
        next(err);
        return;
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

    app.use(_modules.inject);

    app.use((req, res, next) => {
      res.locals.ajax = req.headers['X-Requested-With'] === 'XMLHttpRequest';

      let message;
      if (res.locals.ajax) {
        message = 'rendering ajax request {0}';
      } else {
        message = 'rendering request {0}';
      }

      _logger.log(_logger.info, message, req.path);
      res.render('page');
    });

    app.use((err, req, res, next) => {
      _logger.log(_logger.warn, 'error processing request {0}: {1} {2}', req.path, err.status, err.message);
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};

      res.status(err.status || 500);
      res.render('error');
    });

    return app;
  };
})();
