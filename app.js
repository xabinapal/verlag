;(function() {
  'use strict';

  module.exports = (locals, logger, modules, models) => {
    let appLogger = logger.create('app', true);

    const bodyParser = require('body-parser');
    const escapeHtml = require('escape-html');
    const express = require('express');
    const path = require('path');

    const app = express();

    const menu = require('./menu');
    const router = require('./router');

    app.set('view getter', view => {
      view = path.join(app.get('views'), view);
      !path.extname(view) && (view += '.' + app.get('view engine'));
      return view;
    });

    app.disable('x-powered-by');

    app.use(logger.requestLogger);
    app.use(logger.responseLogger);

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.use((req, res, next) => {
      [req.logger, req.models] = [logger, models];
      res.locals = Object.assign({ modules: new Map() }, locals);
      modules.list().forEach(m => res.locals.modules.set(m, new Map()));
      next();
    });

    app.get('/robots.txt', (req, res, next) => {
      appLogger.log(appLogger.info, 'processing request: /robots.txt');
      // TODO
      res.end();
    });

    app.get('/sitemap.xml', (req, res, next) => {
      appLogger.log(appLogger.info, 'processing request: /sitemap.xml');
      // TODO
      res.end();
    });

    app.use((req, res, next) => {
      appLogger.log(appLogger.info, 'processing request: {0}', req.path);

      let routers;
      models.page.getAll().then(pages => {
        routers = new router.RouterCollection(req, pages);
        req.current = routers.current;
        return models.menu.getAll();
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

    app.use(modules.inject);

    app.use((req, res, next) => {
      res.locals.ajax = req.headers['X-Requested-With'] === 'XMLHttpRequest';

      let message;
      if (res.locals.ajax) {
        message = 'rendering ajax request {0}';
      } else {
        message = 'rendering request {0}';
      }

      appLogger.log(appLogger.info, message, req.path);
      res.render('page');
    });

    app.use((err, req, res, next) => {
      appLogger.log(appLogger.warn, 'error processing request {0}: {1} {2}', req.path, err.status, err.message);
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};

      res.status(err.status || 500);
      res.render('error');
    });

    return app;
  };
})();
